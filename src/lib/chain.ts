import { defineChain } from "viem";

export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
  },
  blockExplorers: {
    default: { name: "Somnia Explorer", url: "https://somnia-testnet.socialscan.io" },
  },
  testnet: true,
});

// Contract addresses (will be updated after deployment)
export const CONTRACTS = {
  KaboomGame: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  KaboomVault: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  ReactiveRiskGuardian: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  ReactiveLeaderboard: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  ReactiveReferral: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  ReactiveWhaleAlert: "0x0000000000000000000000000000000000000000" as `0x${string}`,
} as const;

// Game config constants
export const GAME_CONFIG = {
  GRID_SIZE: 16,
  GRID_COLS: 4,
  HOUSE_EDGE: 0.02,
  MIN_MINES: 1,
  MAX_MINES: 12,
  MINE_OPTIONS: [1, 3, 5, 8, 10, 12] as const,
  MAX_BET_PERCENT: 0.01,   // 1% of vault
  MAX_PAYOUT_PERCENT: 0.10, // 10% of vault
} as const;
