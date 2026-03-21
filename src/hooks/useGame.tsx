"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, parseEther, formatEther, decodeEventLog, encodeFunctionData } from "viem";
import { CONTRACTS, GAME_CONFIG, somniaTestnet } from "@/lib/chain";
import { KaboomGameAbi } from "@/lib/abis";

type GameStatus = "idle" | "starting" | "playing" | "revealing" | "cashing" | "won" | "lost";

interface GameState {
  gameId: bigint | null;
  status: GameStatus;
  bet: number;
  mineCount: number;
  revealedTiles: Set<number>;
  safeTiles: Set<number>;
  mineTiles: Set<number>;
  multiplier: number;
  commitment: string;
  payout: number;
  pendingTile: number | null;
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
  gameId: null, status: "idle", bet: 0.1, mineCount: 5,
  revealedTiles: new Set(), safeTiles: new Set(), mineTiles: new Set(),
  multiplier: 1.0, commitment: "", payout: 0, pendingTile: null,
  sessionPnl: 0, sessionGames: 0, error: null,
};

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(initialState);
  const publicClient = usePublicClient();
  const { wallets } = useWallets();

  // Get Privy embedded wallet (auto-signs, no popup)
  const getWalletClient = useCallback(async () => {
    const wallet = wallets.find(w => w.walletClientType === "privy") || wallets[0];
    if (!wallet) throw new Error("No wallet connected");
    await wallet.switchChain(somniaTestnet.id);
    const provider = await wallet.getEthereumProvider();
    return createWalletClient({
      chain: somniaTestnet,
      transport: custom(provider),
      account: wallet.address as `0x${string}`,
    });
  }, [wallets]);

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
            return { ...prev, revealedTiles: newRevealed, safeTiles: newSafe, mineTiles: newMines, multiplier: safe ? newMult : prev.multiplier, pendingTile: null, error: null };
          });
        }
        if (decoded.eventName === "GameLost") {
          setState(prev => ({ ...prev, status: "lost", pendingTile: null, sessionGames: prev.sessionGames + 1, sessionPnl: prev.sessionPnl - prev.bet }));
        }
        if (decoded.eventName === "GameWon") {
          const args = decoded.args as any;
          const payout = Number(formatEther(args.payout));
          setState(prev => ({ ...prev, status: "won", payout, pendingTile: null, sessionGames: prev.sessionGames + 1, sessionPnl: prev.sessionPnl + (payout - prev.bet) }));
        }
      } catch { /* not our event */ }
    }
  }, []);

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

  // ═══ ACTIONS — all use Privy embedded wallet (auto-sign) ═══

  const setBet = useCallback((bet: number) => setState(prev => ({ ...prev, bet })), []);
  const setMineCount = useCallback((count: number) => setState(prev => ({ ...prev, mineCount: count })), []);

  const startGame = useCallback(async () => {
    setState(prev => ({ ...prev, status: "starting", error: null }));
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.KaboomGame, abi: KaboomGameAbi, functionName: "startGame",
        args: [state.mineCount, "0x0000000000000000000000000000000000000000" as `0x${string}`],
        value: parseEther(state.bet.toString()),
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      parseReceipt(receipt);
    } catch (err: any) {
      setState(prev => ({ ...prev, status: "idle", error: err.shortMessage || err.message?.substring(0, 100) || "Transaction failed" }));
    }
  }, [state.bet, state.mineCount, getWalletClient, publicClient, parseReceipt]);

  const revealTile = useCallback(async (index: number) => {
    if (!state.gameId || state.status !== "playing" || state.pendingTile !== null) return;
    if (state.revealedTiles.has(index)) return;
    setState(prev => ({ ...prev, pendingTile: index, error: null }));
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.KaboomGame, abi: KaboomGameAbi, functionName: "revealTile",
        args: [state.gameId!, index],
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      parseReceipt(receipt);
    } catch (err: any) {
      setState(prev => ({ ...prev, pendingTile: null, error: err.shortMessage || err.message?.substring(0, 100) || "Reveal failed" }));
    }
  }, [state.gameId, state.status, state.pendingTile, state.revealedTiles, getWalletClient, publicClient, parseReceipt]);

  const cashOut = useCallback(async () => {
    if (!state.gameId || state.status !== "playing") return;
    setState(prev => ({ ...prev, status: "cashing", error: null }));
    try {
      const wc = await getWalletClient();
      const hash = await wc.writeContract({
        address: CONTRACTS.KaboomGame, abi: KaboomGameAbi, functionName: "cashOut",
        args: [state.gameId!],
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      parseReceipt(receipt);
    } catch (err: any) {
      setState(prev => ({ ...prev, status: "playing", error: err.shortMessage || err.message?.substring(0, 100) || "Cashout failed" }));
    }
  }, [state.gameId, state.status, getWalletClient, publicClient, parseReceipt]);

  const resetGame = useCallback(() => {
    setState(prev => ({
      ...initialState, bet: prev.bet, mineCount: prev.mineCount,
      sessionPnl: prev.sessionPnl, sessionGames: prev.sessionGames,
    }));
  }, []);

  const value = { state, setBet, setMineCount, startGame, revealTile, cashOut, resetGame };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
