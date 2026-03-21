"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useAccount, usePublicClient, useWalletClient, useReadContract } from "wagmi";
import { parseEther, formatEther, decodeEventLog, parseGwei } from "viem";
import { CONTRACTS, GAME_CONFIG, somniaTestnet } from "@/lib/chain";
import { KaboomGameAbi } from "@/lib/abis";

type GameStatus = "idle" | "starting" | "playing" | "revealing" | "cashing" | "won" | "lost";

export interface GameResult {
  gameId: string;
  player: string;
  won: boolean;
  bet: number;
  payout: number;
  multiplier: number;
  mineCount: number;
  tilesCleared: number;
  txHash: string;
  timestamp: number;
}

interface GameState {
  gameId: bigint | null;
  status: GameStatus;
  bet: number;
  mineCount: number;
  revealedTiles: Set<number>;
  safeTiles: Set<number>;
  mineTiles: Set<number>;
  optimisticTiles: Set<number>; // tiles clicked but not yet confirmed on-chain
  multiplier: number;
  commitment: string;
  payout: number;
  pendingTile: number | null;
  sessionPnl: number;
  sessionGames: number;
  error: string | null;
  lastTxHash: string | null;
}

interface GameContextType {
  state: GameState;
  setBet: (bet: number) => void;
  setMineCount: (count: number) => void;
  startGame: () => void;
  revealTile: (index: number) => void;
  cashOut: () => void;
  resetGame: () => void;
  gameHistory: GameResult[];
}

const initialState: GameState = {
  gameId: null, status: "idle", bet: 0.1, mineCount: 5,
  revealedTiles: new Set(), safeTiles: new Set(), mineTiles: new Set(),
  optimisticTiles: new Set(),
  multiplier: 1.0, commitment: "", payout: 0, pendingTile: null,
  sessionPnl: 0, sessionGames: 0, error: null, lastTxHash: null,
};

const GameContext = createContext<GameContextType | null>(null);

// ═══ LOCAL STORAGE HELPERS ═══
const STORAGE_KEY = "kaboom_game_history";

function loadHistory(): GameResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveResult(result: GameResult) {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory();
    history.unshift(result); // newest first
    if (history.length > 100) history.length = 100; // cap at 100
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { /* localStorage full or unavailable */ }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Load history on mount
  useEffect(() => { setGameHistory(loadHistory()); }, []);

  // Parse game events from tx receipt
  const parseReceipt = useCallback((receipt: any) => {
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: KaboomGameAbi, data: log.data, topics: log.topics });

        if (decoded.eventName === "GameStarted") {
          const args = decoded.args as any;
          setState(prev => ({ ...prev, gameId: args.gameId, status: "playing", commitment: args.commitment, error: null, pendingTile: null }));
        }
        if (decoded.eventName === "TileRevealed") {
          const args = decoded.args as any;
          const tileIdx = Number(args.tileIndex);
          const safe = args.safe;
          const newMult = Number(args.newMultiplier) / 1e18;
          setState(prev => {
            const newRevealed = new Set(Array.from(prev.revealedTiles));
            newRevealed.add(tileIdx);
            const newSafe = new Set(Array.from(prev.safeTiles));
            const newMines = new Set(Array.from(prev.mineTiles));
            if (safe) newSafe.add(tileIdx); else newMines.add(tileIdx);
            // Remove from optimistic set — now confirmed on-chain
            const newOptimistic = new Set([...Array.from(prev.optimisticTiles)].filter(t => t !== tileIdx));
            return { ...prev, revealedTiles: newRevealed, safeTiles: newSafe, mineTiles: newMines, optimisticTiles: newOptimistic, multiplier: safe ? newMult : prev.multiplier, pendingTile: null, error: null };
          });
        }
        if (decoded.eventName === "GameLost") {
          setState(prev => {
            return { ...prev, status: "lost" as GameStatus, pendingTile: null, lastTxHash: receipt.transactionHash, sessionGames: prev.sessionGames + 1, sessionPnl: prev.sessionPnl - prev.bet };
          });
          // Save to localStorage OUTSIDE setState
          setState(prev => {
            const result: GameResult = {
              gameId: prev.gameId?.toString() || "0",
              player: address || "0x0",
              won: false, bet: prev.bet, payout: 0, multiplier: 0,
              mineCount: prev.mineCount, tilesCleared: prev.safeTiles.size,
              txHash: receipt.transactionHash, timestamp: Date.now(),
            };
            saveResult(result);
            return prev;
          });
          setGameHistory(loadHistory());
        }
        if (decoded.eventName === "GameWon") {
          const args = decoded.args as any;
          const payout = Number(formatEther(args.payout));
          const mult = Number(args.multiplier) / 1e18;
          setState(prev => {
            return { ...prev, status: "won" as GameStatus, payout, lastTxHash: receipt.transactionHash, pendingTile: null, sessionGames: prev.sessionGames + 1, sessionPnl: prev.sessionPnl + (payout - prev.bet) };
          });
          // Save to localStorage OUTSIDE setState
          setState(prev => {
            const result: GameResult = {
              gameId: prev.gameId?.toString() || "0",
              player: address || "0x0",
              won: true, bet: prev.bet, payout, multiplier: mult,
              mineCount: prev.mineCount, tilesCleared: prev.safeTiles.size,
              txHash: receipt.transactionHash, timestamp: Date.now(),
            };
            saveResult(result);
            return prev;
          });
          setGameHistory(loadHistory());
        }
      } catch { /* not our event */ }
    }
  }, [address]);

  // Reveal mines after loss
  const { data: verifyData } = useReadContract({
    address: CONTRACTS.KaboomGame, abi: KaboomGameAbi, functionName: "verifyGame",
    args: state.gameId ? [state.gameId] : undefined,
    query: { enabled: !!state.gameId && state.status === "lost" },
  });

  useEffect(() => {
    if (verifyData && state.status === "lost") {
      const [, , mineLayout] = verifyData as [boolean, string, number, string];
      const mines = new Set<number>();
      for (let i = 0; i < 16; i++) { if (Number(mineLayout) & (1 << i)) mines.add(i); }
      setState(prev => ({
        ...prev, mineTiles: mines,
        revealedTiles: new Set([...Array.from(prev.revealedTiles), ...Array.from(mines)]),
      }));
    }
  }, [verifyData, state.status]);

  // ═══ ACTIONS ═══

  const setBet = useCallback((bet: number) => setState(prev => ({ ...prev, bet })), []);
  const setMineCount = useCallback((count: number) => setState(prev => ({ ...prev, mineCount: count })), []);

  const startGame = useCallback(async () => {
    if (!walletClient || !publicClient) return;
    setState(prev => ({ ...prev, status: "starting", error: null }));
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.KaboomGame, abi: KaboomGameAbi, functionName: "startGame",
        args: [state.mineCount, "0x0000000000000000000000000000000000000000" as `0x${string}`],
        value: parseEther(state.bet.toString()),
        gas: 300_000n,        // skip eth_estimateGas round-trip (~300ms)
        gasPrice: parseGwei("6"), // skip eth_feeHistory round-trip (~260ms)
        chain: somniaTestnet,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash, pollingInterval: 300 });
      parseReceipt(receipt);
    } catch (err: any) {
      setState(prev => ({ ...prev, status: "idle", error: err.shortMessage || err.message?.substring(0, 100) || "Transaction failed" }));
    }
  }, [state.bet, state.mineCount, walletClient, publicClient, parseReceipt]);

  const revealTile = useCallback(async (index: number) => {
    if (!state.gameId || state.status !== "playing" || state.pendingTile !== null || !walletClient || !publicClient) return;
    if (state.revealedTiles.has(index) || state.optimisticTiles.has(index)) return;

    // ✅ OPTIMISTIC UPDATE — tile flips immediately, no waiting for tx
    setState(prev => ({
      ...prev,
      pendingTile: index,
      optimisticTiles: new Set([...Array.from(prev.optimisticTiles), index]),
      error: null,
    }));

    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.KaboomGame, abi: KaboomGameAbi, functionName: "revealTile",
        args: [state.gameId!, index],
        gas: 150_000n,        // skip eth_estimateGas round-trip (~300ms)
        gasPrice: parseGwei("6"), // skip eth_feeHistory round-trip (~260ms)
        chain: somniaTestnet,
      });
      // 🚀 Fast polling — Somnia has sub-second finality, don't wait 4s between polls
      const receipt = await publicClient.waitForTransactionReceipt({ hash, pollingInterval: 300 });
      parseReceipt(receipt);
    } catch (err: any) {
      // Revert optimistic update on failure
      setState(prev => ({
        ...prev,
        pendingTile: null,
        optimisticTiles: new Set([...Array.from(prev.optimisticTiles)].filter(t => t !== index)),
        error: err.shortMessage || err.message?.substring(0, 100) || "Reveal failed",
      }));
    }
  }, [state.gameId, state.status, state.pendingTile, state.revealedTiles, state.optimisticTiles, walletClient, publicClient, parseReceipt]);

  const cashOut = useCallback(async () => {
    if (!state.gameId || state.status !== "playing" || !walletClient || !publicClient) return;
    setState(prev => ({ ...prev, status: "cashing", error: null }));
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.KaboomGame, abi: KaboomGameAbi, functionName: "cashOut",
        args: [state.gameId!],
        gas: 120_000n,        // skip eth_estimateGas round-trip (~300ms)
        gasPrice: parseGwei("6"), // skip eth_feeHistory round-trip (~260ms)
        chain: somniaTestnet,
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash, pollingInterval: 300 });
      parseReceipt(receipt);
    } catch (err: any) {
      setState(prev => ({ ...prev, status: "playing", error: err.shortMessage || err.message?.substring(0, 100) || "Cashout failed" }));
    }
  }, [state.gameId, state.status, walletClient, publicClient, parseReceipt]);

  // FULL RESET — clears all tiles, mines, everything back to idle
  const resetGame = useCallback(() => {
    setState(prev => ({
      gameId: null,
      status: "idle",
      bet: prev.bet,
      mineCount: prev.mineCount,
      revealedTiles: new Set(),
      safeTiles: new Set(),
      mineTiles: new Set(),
      optimisticTiles: new Set(),
      multiplier: 1.0,
      commitment: "",
      payout: 0,
      pendingTile: null,
      sessionPnl: prev.sessionPnl,
      sessionGames: prev.sessionGames,
      error: null,
      lastTxHash: null,
    }));
  }, []);

  const value = { state, setBet, setMineCount, startGame, revealTile, cashOut, resetGame, gameHistory };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
