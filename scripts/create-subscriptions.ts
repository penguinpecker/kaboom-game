import { SDK } from "@somnia-chain/reactivity";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http, keccak256, toBytes, parseGwei } from "viem";

const somniaTestnet = {
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: ["https://dream-rpc.somnia.network"] } },
  blockExplorers: { default: { name: "Explorer", url: "https://shannon-explorer.somnia.network" } },
};

const KABOOM_GAME = "0x9b0A46e35FB743eD366077ce16C497eFeEd37E2F";
const KABOOM_VAULT = "0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b";
const RISK_GUARDIAN = "0x208C305F9D1794461d7069be1003e7e979C38e3F";
const LEADERBOARD = "0x82F67Bec332c7A49D73C8078bdD72A4E381968fd";
const REFERRAL = "0xb655A2d9b4242CfBE33fB95F6aeD8AF2A387d3B1";
const WHALE_ALERT = "0x5CE39982b73BA6ba21d5B649CE61A283615F4A4E";

const EVENT_SIGS = {
  GameSettled: keccak256(toBytes("GameSettled(uint256,address,bool,uint256,uint256)")),
  GameWon: keccak256(toBytes("GameWon(uint256,address,uint256,uint256)")),
  BetPlaced: keccak256(toBytes("BetPlaced(uint256,address,uint256,address)")),
  VaultBalanceChanged: keccak256(toBytes("VaultBalanceChanged(uint256,uint256)")),
};

async function main() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  if (!PRIVATE_KEY) { console.error("Set PRIVATE_KEY env var"); process.exit(1); }

  const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: somniaTestnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: somniaTestnet, transport: http() });
  const sdk = new SDK({ public: publicClient, wallet: walletClient });

  console.log("Owner:", account.address);
  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", Number(balance) / 1e18, "STT\n");

  const subscriptions = [
    { name: "Sub 1: GameSettled -> RiskGuardian (DeFi)", emitter: KABOOM_GAME, handler: RISK_GUARDIAN, eventTopic: EVENT_SIGS.GameSettled },
    { name: "Sub 2: VaultBalanceChanged -> RiskGuardian (Automation)", emitter: KABOOM_VAULT, handler: RISK_GUARDIAN, eventTopic: EVENT_SIGS.VaultBalanceChanged },
    { name: "Sub 3: GameWon -> Leaderboard (Gaming)", emitter: KABOOM_GAME, handler: LEADERBOARD, eventTopic: EVENT_SIGS.GameWon },
    { name: "Sub 4: BetPlaced -> Referral (Onchain Tracker)", emitter: KABOOM_GAME, handler: REFERRAL, eventTopic: EVENT_SIGS.BetPlaced },
    { name: "Sub 5: BetPlaced -> WhaleAlert (Onchain Tracker)", emitter: KABOOM_GAME, handler: WHALE_ALERT, eventTopic: EVENT_SIGS.BetPlaced },
  ];

  for (const sub of subscriptions) {
    console.log(`Creating: ${sub.name}`);
    try {
      const txHash = await sdk.createSoliditySubscription({
        handlerContractAddress: sub.handler as `0x${string}`,
        emitter: sub.emitter as `0x${string}`,
        eventTopics: [sub.eventTopic],
        priorityFeePerGas: parseGwei("2"),
        maxFeePerGas: parseGwei("10"),
        gasLimit: 3_000_000n,
        isGuaranteed: true,
        isCoalesced: false,
      });

      if (txHash instanceof Error) {
        console.log(`  x Failed: ${txHash.message}`);
      } else {
        console.log(`  OK tx: ${txHash}`);
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log(`  OK Confirmed! Block: ${receipt.blockNumber}, Status: ${receipt.status}`);
      }
    } catch (err: any) {
      console.log(`  x Error: ${err.message || err}`);
    }
    console.log();
  }

  console.log("Done! All 5 reactive subscriptions created.");
}

main().catch(console.error);
