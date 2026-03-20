"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from "wagmi";
import { parseEther, formatEther, decodeEventLog } from "viem";
import { CONTRACTS, GAME_CONFIG } from "@/lib/chain";
import { KaboomGameAbi, KaboomVaultAbi } from "@/lib/abis";

// ═══ TYPES ═══
type GameStatus = "idle" | "starting" | "playing" | "revealing" | "cashing" | "won" | "lost";

interface GameState {
  gameId: bigint | null;
  status: GameStatus;
  bet: number;           // in STT (float)
  mineCount: number;
  revealedTiles: Set<number>;
  safeTiles: Set<number>;
  mineTiles: Set<number>;
  multiplier: number;    // float, e.g. 1.43
  commitment: string;
  payout: number;
  pendingTile: number | null;
  txHash: string | null;
  sessionPnl: number;
  sessionGames: number;
  error: string | null;
}

interface GameContextType {
  state: GameState;
  setBet: (bet: number) => void;
  setMineCount: (count: number) => void;
  startGame: () => void;
  revealTile: (index: number) => void;
  cashOut: () => void;
  resetGame: () => void;
}

const initialState: GameState = {
  gameId: null,
  status: "idle",
  bet: 0.1,
  mineCount: 5,
  revealedTiles: new Set(),
  safeTiles: new Set(),
  mineTiles: new Set(),
  multiplier: 1.0,
  commitment: "",
  payout: 0,
  pendingTile: null,
  txHash: null,
  sessionPnl: 0,
  sessionGames: 0,
  error: null,
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  // ═══ CONTRACT WRITES ═══
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { data: receipt, isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // ═══ READ GAME DATA FROM CONTRACT ═══
  const { data: onChainGame, refetch: refetchGame } = useReadContract({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    functionName: "getGame",
    args: state.gameId ? [state.gameId] : undefined,
    query: { enabled: !!state.gameId },
  });

  // ═══ READ MINE LAYOUT AFTER GAME ENDS ═══
  const { data: verifyData } = useReadContract({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    functionName: "verifyGame",
    args: state.gameId ? [state.gameId] : undefined,
    query: { enabled: !!state.gameId && (state.status === "won" || state.status === "lost") },
  });

  // ═══ HANDLE TX CONFIRMATIONS ═══
  useEffect(() => {
    if (!txConfirmed || !receipt) return;

    const processReceipt = async () => {
      // Parse events from receipt
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: KaboomGameAbi,
            data: log.data,
            topics: log.topics,
          });

          if (decoded.eventName === "GameStarted") {
            const args = decoded.args as any;
            setState(prev => ({
              ...prev,
              gameId: args.gameId,
              status: "playing",
              commitment: args.commitment,
              error: null,
              pendingTile: null,
            }));
          }

          if (decoded.eventName === "TileRevealed") {
            const args = decoded.args as any;
            const tileIdx = Number(args.tileIndex);
            const safe = args.safe;
            const newMult = Number(args.newMultiplier) / 1e18;

            setState(prev => {
              const newRevealed = new Set(prev.revealedTiles);
              newRevealed.add(tileIdx);
              const newSafe = new Set(prev.safeTiles);
              const newMines = new Set(prev.mineTiles);

              if (safe) {
                newSafe.add(tileIdx);
              } else {
                newMines.add(tileIdx);
              }

              return {
                ...prev,
                revealedTiles: newRevealed,
                safeTiles: newSafe,
                mineTiles: newMines,
                multiplier: safe ? newMult : prev.multiplier,
                pendingTile: null,
                error: null,
              };
            });
          }

          if (decoded.eventName === "GameLost") {
            const args = decoded.args as any;
            setState(prev => ({
              ...prev,
              status: "lost",
              pendingTile: null,
              sessionGames: prev.sessionGames + 1,
              sessionPnl: prev.sessionPnl - prev.bet,
            }));
          }

          if (decoded.eventName === "GameWon") {
            const args = decoded.args as any;
            const payout = Number(formatEther(args.payout));
            setState(prev => ({
              ...prev,
              status: "won",
              payout,
              pendingTile: null,
              sessionGames: prev.sessionGames + 1,
              sessionPnl: prev.sessionPnl + (payout - prev.bet),
            }));
          }
        } catch {
          // Not our event, skip
        }
      }
    };

    processReceipt();
    resetWrite();
  }, [txConfirmed, receipt, resetWrite]);

  // ═══ REVEAL MINE POSITIONS AFTER LOSS ═══
  useEffect(() => {
    if (verifyData && state.status === "lost") {
      const [, , mineLayout] = verifyData as [boolean, string, number, string];
      const mines = decodeBitmap(Number(mineLayout));
      setState(prev => ({
        ...prev,
        mineTiles: mines,
        revealedTiles: new Set([...Array.from(prev.revealedTiles), ...Array.from(mines)]),
      }));
    }
  }, [verifyData, state.status]);

  // ═══ HANDLE WRITE ERRORS ═══
  useEffect(() => {
    if (writeError) {
      setState(prev => ({
        ...prev,
        status: prev.gameId ? "playing" : "idle",
        pendingTile: null,
        error: writeError.message.substring(0, 100),
      }));
    }
  }, [writeError]);

  // ═══ ACTIONS ═══
  const setBet = useCallback((bet: number) => {
    setState(prev => ({ ...prev, bet }));
  }, []);

  const setMineCount = useCallback((count: number) => {
    setState(prev => ({ ...prev, mineCount: count }));
  }, []);

  const startGame = useCallback(() => {
    if (!isConnected) return;
    setState(prev => ({ ...prev, status: "starting", error: null }));
    writeContract({
      address: CONTRACTS.KaboomGame,
      abi: KaboomGameAbi,
      functionName: "startGame",
      args: [state.mineCount, "0x0000000000000000000000000000000000000000" as `0x${string}`],
      value: parseEther(state.bet.toString()),
    });
  }, [isConnected, state.bet, state.mineCount, writeContract]);

  const revealTile = useCallback((index: number) => {
    if (!state.gameId || state.status !== "playing" || state.pendingTile !== null) return;
    if (state.revealedTiles.has(index)) return;
    setState(prev => ({ ...prev, pendingTile: index, error: null }));
    writeContract({
      address: CONTRACTS.KaboomGame,
      abi: KaboomGameAbi,
      functionName: "revealTile",
      args: [state.gameId!, index],
    });
  }, [state.gameId, state.status, state.pendingTile, state.revealedTiles, writeContract]);

  const cashOut = useCallback(() => {
    if (!state.gameId || state.status !== "playing") return;
    setState(prev => ({ ...prev, status: "cashing", error: null }));
    writeContract({
      address: CONTRACTS.KaboomGame,
      abi: KaboomGameAbi,
      functionName: "cashOut",
      args: [state.gameId!],
    });
  }, [state.gameId, state.status, writeContract]);

  const resetGame = useCallback(() => {
    resetWrite();
    setState(prev => ({
      ...initialState,
      bet: prev.bet,
      mineCount: prev.mineCount,
      sessionPnl: prev.sessionPnl,
      sessionGames: prev.sessionGames,
    }));
  }, [resetWrite]);

  const value = { state, setBet, setMineCount, startGame, revealTile, cashOut, resetGame };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

// ═══ HELPERS ═══
function decodeBitmap(bitmap: number): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i < 16; i++) {
    if (bitmap & (1 << i)) set.add(i);
  }
  return set;
}
