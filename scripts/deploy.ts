import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "STT\n");

  // ═══ 1. Deploy KaboomVault ═══
  console.log("1. Deploying KaboomVault...");
  const Vault = await ethers.getContractFactory("KaboomVault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("   KaboomVault:", vaultAddr);

  // ═══ 2. Deploy KaboomGame ═══
  console.log("2. Deploying KaboomGame...");
  const Game = await ethers.getContractFactory("KaboomGame");
  const game = await Game.deploy(vaultAddr);
  await game.waitForDeployment();
  const gameAddr = await game.getAddress();
  console.log("   KaboomGame:", gameAddr);

  // ═══ 3. Deploy ReactiveRiskGuardian ═══
  console.log("3. Deploying ReactiveRiskGuardian...");
  const Guardian = await ethers.getContractFactory("ReactiveRiskGuardian");
  const guardian = await Guardian.deploy(vaultAddr);
  await guardian.waitForDeployment();
  const guardianAddr = await guardian.getAddress();
  console.log("   ReactiveRiskGuardian:", guardianAddr);

  // ═══ 4. Deploy ReactiveLeaderboard ═══
  console.log("4. Deploying ReactiveLeaderboard...");
  const Leaderboard = await ethers.getContractFactory("ReactiveLeaderboard");
  const leaderboard = await Leaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddr = await leaderboard.getAddress();
  console.log("   ReactiveLeaderboard:", leaderboardAddr);

  // ═══ 5. Deploy ReactiveReferral ═══
  console.log("5. Deploying ReactiveReferral...");
  const Referral = await ethers.getContractFactory("ReactiveReferral");
  const referral = await Referral.deploy();
  await referral.waitForDeployment();
  const referralAddr = await referral.getAddress();
  console.log("   ReactiveReferral:", referralAddr);

  // ═══ 6. Deploy ReactiveWhaleAlert ═══
  console.log("6. Deploying ReactiveWhaleAlert...");
  const Whale = await ethers.getContractFactory("ReactiveWhaleAlert");
  const whale = await Whale.deploy(vaultAddr, guardianAddr);
  await whale.waitForDeployment();
  const whaleAddr = await whale.getAddress();
  console.log("   ReactiveWhaleAlert:", whaleAddr);

  // ═══ 7. Configure Roles ═══
  console.log("\n7. Setting roles...");

  const tx1 = await vault.setGameContract(gameAddr);
  await tx1.wait();
  console.log("   Vault → Game contract set");

  const tx2 = await vault.setRiskGuardian(guardianAddr);
  await tx2.wait();
  console.log("   Vault → Risk guardian set");

  // ═══ 8. Fund Vault ═══
  console.log("\n8. Funding vault with 10 STT...");
  const tx3 = await vault.deposit({ value: ethers.parseEther("10") });
  await tx3.wait();
  console.log("   Vault funded:", ethers.formatEther(await vault.getBalance()), "STT");

  // ═══ SUMMARY ═══
  console.log("\n" + "═".repeat(50));
  console.log("DEPLOYMENT COMPLETE");
  console.log("═".repeat(50));
  console.log(`KaboomVault:           ${vaultAddr}`);
  console.log(`KaboomGame:            ${gameAddr}`);
  console.log(`ReactiveRiskGuardian:  ${guardianAddr}`);
  console.log(`ReactiveLeaderboard:   ${leaderboardAddr}`);
  console.log(`ReactiveReferral:      ${referralAddr}`);
  console.log(`ReactiveWhaleAlert:    ${whaleAddr}`);
  console.log("═".repeat(50));

  // Output JSON for frontend config
  const addresses = {
    KaboomVault: vaultAddr,
    KaboomGame: gameAddr,
    ReactiveRiskGuardian: guardianAddr,
    ReactiveLeaderboard: leaderboardAddr,
    ReactiveReferral: referralAddr,
    ReactiveWhaleAlert: whaleAddr,
  };
  console.log("\nFrontend config (copy to src/lib/chain.ts):");
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
