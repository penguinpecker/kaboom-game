"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS } from "@/lib/chain";
import { KaboomGameAbi, KaboomVaultAbi, ReactiveLeaderboardAbi, ReactiveReferralAbi, ReactiveRiskGuardianAbi, ReactiveWhaleAlertAbi } from "@/lib/abis";
import { useCallback, useState } from "react";

// ═══════════════════════════════════════════════
// GAME CONTRACT HOOKS
// ═══════════════════════════════════════════════

export function useStartGame() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const startGame = useCallback(
    (betAmount: string, mineCount: number, referrer?: `0x${string}`) => {
      const ref = referrer || "0x0000000000000000000000000000000000000000" as `0x${string}`;
      writeContract({
        address: CONTRACTS.KaboomGame,
        abi: KaboomGameAbi,
        functionName: "startGame",
        args: [mineCount, ref],
        value: parseEther(betAmount),
      });
    },
    [writeContract]
  );

  return { startGame, hash, isPending, isConfirming, isSuccess, error };
}

export function useRevealTile() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const revealTile = useCallback(
    (gameId: bigint, tileIndex: number) => {
      writeContract({
        address: CONTRACTS.KaboomGame,
        abi: KaboomGameAbi,
        functionName: "revealTile",
        args: [gameId, tileIndex],
      });
    },
    [writeContract]
  );

  return { revealTile, hash, isPending, isConfirming, isSuccess, error };
}

export function useCashOut() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cashOut = useCallback(
    (gameId: bigint) => {
      writeContract({
        address: CONTRACTS.KaboomGame,
        abi: KaboomGameAbi,
        functionName: "cashOut",
        args: [gameId],
      });
    },
    [writeContract]
  );

  return { cashOut, hash, isPending, isConfirming, isSuccess, error };
}

export function useGameData(gameId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    functionName: "getGame",
    args: gameId ? [gameId] : undefined,
    query: { enabled: !!gameId },
  });
}

export function useVerifyGame(gameId: bigint | undefined) {
  return useReadContract({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    functionName: "verifyGame",
    args: gameId ? [gameId] : undefined,
    query: { enabled: !!gameId },
  });
}

export function useGameCounter() {
  return useReadContract({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    functionName: "gameCounter",
  });
}

// ═══════════════════════════════════════════════
// VAULT HOOKS
// ═══════════════════════════════════════════════

export function useVaultBalance() {
  return useReadContract({
    address: CONTRACTS.KaboomVault,
    abi: KaboomVaultAbi,
    functionName: "getBalance",
  });
}

export function useVaultMaxBet() {
  return useReadContract({
    address: CONTRACTS.KaboomVault,
    abi: KaboomVaultAbi,
    functionName: "getMaxBet",
  });
}

export function useVaultMaxPayout() {
  return useReadContract({
    address: CONTRACTS.KaboomVault,
    abi: KaboomVaultAbi,
    functionName: "getMaxPayout",
  });
}

export function useVaultHealth() {
  return useReadContract({
    address: CONTRACTS.KaboomVault,
    abi: KaboomVaultAbi,
    functionName: "getHealthPercent",
  });
}

export function useDepositToVault() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = useCallback(
    (amount: string) => {
      writeContract({
        address: CONTRACTS.KaboomVault,
        abi: KaboomVaultAbi,
        functionName: "deposit",
        value: parseEther(amount),
      });
    },
    [writeContract]
  );

  return { deposit, hash, isPending, isConfirming, isSuccess, error };
}

// ═══════════════════════════════════════════════
// LEADERBOARD HOOKS
// ═══════════════════════════════════════════════

export function useLeaderboard() {
  return useReadContract({
    address: CONTRACTS.ReactiveLeaderboard,
    abi: ReactiveLeaderboardAbi,
    functionName: "getLeaderboard",
  });
}

export function usePlayerStats(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.ReactiveLeaderboard,
    abi: ReactiveLeaderboardAbi,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

// ═══════════════════════════════════════════════
// REFERRAL HOOKS
// ═══════════════════════════════════════════════

export function useReferralStats(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.ReactiveReferral,
    abi: ReactiveReferralAbi,
    functionName: "getReferralStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

export function useClaimReferralRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claim = useCallback(() => {
    writeContract({
      address: CONTRACTS.ReactiveReferral,
      abi: ReactiveReferralAbi,
      functionName: "claimRewards",
    });
  }, [writeContract]);

  return { claim, hash, isPending, isConfirming, isSuccess, error };
}

// ═══════════════════════════════════════════════
// RISK GUARDIAN HOOKS
// ═══════════════════════════════════════════════

export function useRiskLevel() {
  return useReadContract({
    address: CONTRACTS.ReactiveRiskGuardian,
    abi: ReactiveRiskGuardianAbi,
    functionName: "currentRisk",
  });
}

// ═══════════════════════════════════════════════
// WHALE ALERT HOOKS
// ═══════════════════════════════════════════════

export function useWhaleAlerts(count: number = 5) {
  return useReadContract({
    address: CONTRACTS.ReactiveWhaleAlert,
    abi: ReactiveWhaleAlertAbi,
    functionName: "getRecentWhaleEvents",
    args: [BigInt(count)],
  });
}

export function useWhaleAlertCount() {
  return useReadContract({
    address: CONTRACTS.ReactiveWhaleAlert,
    abi: ReactiveWhaleAlertAbi,
    functionName: "totalWhaleAlerts",
  });
}

// ═══════════════════════════════════════════════
// EVENT WATCHERS
// ═══════════════════════════════════════════════

export function useWatchGameEvents(onGameEvent: (log: any) => void) {
  useWatchContractEvent({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    eventName: "TileRevealed",
    onLogs: (logs) => logs.forEach(onGameEvent),
  });

  useWatchContractEvent({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    eventName: "GameWon",
    onLogs: (logs) => logs.forEach(onGameEvent),
  });

  useWatchContractEvent({
    address: CONTRACTS.KaboomGame,
    abi: KaboomGameAbi,
    eventName: "GameLost",
    onLogs: (logs) => logs.forEach(onGameEvent),
  });
}

// ═══════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════

export function formatSTTFromWei(wei: bigint | undefined): string {
  if (!wei) return "0";
  return formatEther(wei);
}

export function formatMultFromWad(wad: bigint | undefined): string {
  if (!wad) return "1.00×";
  const num = Number(wad) / 1e18;
  return num.toFixed(2) + "×";
}
