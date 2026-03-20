import { ethers } from "hardhat";

// Somnia Reactivity Precompile address
const REACTIVITY_PRECOMPILE = "0x0000000000000000000000000000000000000100";

// ABI for the precompile subscription management
const PRECOMPILE_ABI = [
  "function createSubscription(bytes calldata subscriptionData) external returns (uint256 subscriptionId)",
];

/**
 * Setup all 6 reactive subscriptions for Kaboom!
 * 
 * Run after deploy.ts. Update the addresses below with your deployed contract addresses.
 */
async function main() {
  const [owner] = await ethers.getSigners();

  // ════════════════════════════════════════
  // UPDATE THESE WITH YOUR DEPLOYED ADDRESSES
  // ════════════════════════════════════════
  const ADDRESSES = {
    KaboomGame: process.env.KABOOM_GAME || "0x0000000000000000000000000000000000000000",
    KaboomVault: process.env.KABOOM_VAULT || "0x0000000000000000000000000000000000000000",
    ReactiveRiskGuardian: process.env.RISK_GUARDIAN || "0x0000000000000000000000000000000000000000",
    ReactiveLeaderboard: process.env.LEADERBOARD || "0x0000000000000000000000000000000000000000",
    ReactiveReferral: process.env.REFERRAL || "0x0000000000000000000000000000000000000000",
    ReactiveWhaleAlert: process.env.WHALE_ALERT || "0x0000000000000000000000000000000000000000",
  };

  console.log("Setting up reactive subscriptions...");
  console.log("Owner:", owner.address);
  console.log("Ensure owner has 32+ STT per subscription (192 STT total)\n");

  // Event signatures
  const EVENT_SIGS = {
    GameSettled: ethers.id("GameSettled(uint256,address,bool,uint256,uint256)"),
    GameWon: ethers.id("GameWon(uint256,address,uint256,uint256)"),
    BetPlaced: ethers.id("BetPlaced(uint256,address,uint256,address)"),
    VaultBalanceChanged: ethers.id("VaultBalanceChanged(uint256,uint256)"),
  };

  // Define all 6 subscriptions
  const subscriptions = [
    {
      name: "Sub 1: GameSettled → RiskGuardian (DeFi)",
      emitter: ADDRESSES.KaboomGame,
      handler: ADDRESSES.ReactiveRiskGuardian,
      eventTopic: EVENT_SIGS.GameSettled,
    },
    {
      name: "Sub 2: VaultBalanceChanged → RiskGuardian (Automation)",
      emitter: ADDRESSES.KaboomVault,
      handler: ADDRESSES.ReactiveRiskGuardian,
      eventTopic: EVENT_SIGS.VaultBalanceChanged,
    },
    {
      name: "Sub 3: GameWon → Leaderboard (Gaming)",
      emitter: ADDRESSES.KaboomGame,
      handler: ADDRESSES.ReactiveLeaderboard,
      eventTopic: EVENT_SIGS.GameWon,
    },
    {
      name: "Sub 4: BetPlaced → Referral (Onchain Tracker)",
      emitter: ADDRESSES.KaboomGame,
      handler: ADDRESSES.ReactiveReferral,
      eventTopic: EVENT_SIGS.BetPlaced,
    },
    {
      name: "Sub 5: BetPlaced → WhaleAlert (Onchain Tracker)",
      emitter: ADDRESSES.KaboomGame,
      handler: ADDRESSES.ReactiveWhaleAlert,
      eventTopic: EVENT_SIGS.BetPlaced,
    },
  ];

  console.log("Subscriptions to create:");
  subscriptions.forEach((s, i) => console.log(`  ${i + 1}. ${s.name}`));
  console.log();

  // Note: The actual SDK call depends on the @somnia-chain/reactivity SDK version
  // Below is the pattern using the SDK directly
  console.log("═".repeat(50));
  console.log("SDK SETUP COMMANDS");
  console.log("═".repeat(50));
  console.log("\nInstall SDK: npm install @somnia-chain/reactivity\n");
  console.log("Run this TypeScript code with your private key:\n");

  console.log(`
import { SDK } from '@somnia-chain/reactivity';
import { parseGwei } from 'viem';

const sdk = new SDK({
  rpcUrl: 'https://dream-rpc.somnia.network',
  privateKey: process.env.PRIVATE_KEY,
});

const subscriptions = ${JSON.stringify(subscriptions.map(s => ({
    emitter: s.emitter,
    handlerContractAddress: s.handler,
    eventTopics: [s.eventTopic],
    priorityFeePerGas: "2000000000",
    maxFeePerGas: "10000000000",
    gasLimit: "500000",
    isGuaranteed: true,
    isCoalesced: false,
  })), null, 2)};

for (const sub of subscriptions) {
  const txHash = await sdk.createSoliditySubscription(sub);
  console.log('Subscription created:', txHash);
}
  `);

  console.log("\n═".repeat(50));
  console.log("Alternatively, use the contract addresses above with");
  console.log("the Somnia SDK CLI or Dashboard to create subscriptions.");
  console.log("═".repeat(50));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
