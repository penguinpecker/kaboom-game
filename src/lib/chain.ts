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

// Contract addresses — deployed on Somnia Testnet
export const CONTRACTS = {
  KaboomGame: "0x9b0A46e35FB743eD366077ce16C497eFeEd37E2F" as `0x${string}`,
  KaboomVault: "0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b" as `0x${string}`,
  ReactiveRiskGuardian: "0x208C305F9D1794461d7069be1003e7e979C38e3F" as `0x${string}`,
  ReactiveLeaderboard: "0x82F67Bec332c7A49D73C8078bdD72A4E381968fd" as `0x${string}`,
  ReactiveReferral: "0xb655A2d9b4242CfBE33fB95F6aeD8AF2A387d3B1" as `0x${string}`,
  ReactiveWhaleAlert: "0x5CE39982b73BA6ba21d5B649CE61A283615F4A4E" as `0x${string}`,
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
