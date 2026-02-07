import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  // Deploy AgentNFT
  console.log("\n--- Deploying AgentNFT ---");
  const AgentNFT = await ethers.getContractFactory("AgentNFT");
  const agentNFT = await AgentNFT.deploy();
  await agentNFT.waitForDeployment();
  const agentNFTAddress = await agentNFT.getAddress();
  console.log("AgentNFT deployed to:", agentNFTAddress);

  // Deploy SurvivalIsland
  console.log("\n--- Deploying SurvivalIsland ---");
  const SurvivalIsland = await ethers.getContractFactory("SurvivalIsland");
  const survivalIsland = await SurvivalIsland.deploy(agentNFTAddress);
  await survivalIsland.waitForDeployment();
  const survivalIslandAddress = await survivalIsland.getAddress();
  console.log("SurvivalIsland deployed to:", survivalIslandAddress);

  // Transfer AgentNFT ownership to SurvivalIsland so it can manage agent state
  console.log("\n--- Transferring AgentNFT ownership ---");
  await agentNFT.transferOwnership(survivalIslandAddress);
  console.log("AgentNFT ownership transferred to SurvivalIsland");

  console.log("\n========================================");
  console.log("Deployment Summary:");
  console.log("========================================");
  console.log(`NEXT_PUBLIC_AGENT_NFT_ADDRESS=${agentNFTAddress}`);
  console.log(`NEXT_PUBLIC_SURVIVAL_ISLAND_ADDRESS=${survivalIslandAddress}`);
  console.log("========================================");
  console.log("\nAdd these to your .env file!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
