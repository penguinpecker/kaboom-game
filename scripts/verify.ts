import pkg from "hardhat";
const { run } = pkg;
const CONTRACTS: Record<string, { address: string; args: any[] }> = {
  KaboomVault: { address: "0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b", args: [] },
  KaboomGame: { address: "0x9b0A46e35FB743eD366077ce16C497eFeEd37E2F", args: ["0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b"] },
  ReactiveRiskGuardian: { address: "0x208C305F9D1794461d7069be1003e7e979C38e3F", args: ["0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b"] },
  ReactiveLeaderboard: { address: "0x82F67Bec332c7A49D73C8078bdD72A4E381968fd", args: [] },
  ReactiveReferral: { address: "0xb655A2d9b4242CfBE33fB95F6aeD8AF2A387d3B1", args: [] },
  ReactiveWhaleAlert: { address: "0x5CE39982b73BA6ba21d5B649CE61A283615F4A4E", args: ["0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b", "0x208C305F9D1794461d7069be1003e7e979C38e3F"] },
};
async function main() {
  for (const [name, { address, args }] of Object.entries(CONTRACTS)) {
    console.log(`\nVerifying ${name} at ${address}...`);
    try {
      await run("verify:verify", { address, constructorArguments: args });
      console.log(`  ✓ ${name} verified!`);
    } catch (err: any) {
      if (err.message?.includes("Already Verified") || err.message?.includes("already verified")) {
        console.log(`  ✓ ${name} already verified`);
      } else {
        console.log(`  ✗ ${name} failed:`, err.message);
      }
    }
  }
}
main().catch(console.error);
