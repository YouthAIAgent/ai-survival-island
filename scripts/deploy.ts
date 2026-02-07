import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  const connection = await hre.network.connect();

  // Wrap the Hardhat provider with ethers
  const provider = new ethers.BrowserProvider(connection.provider);
  const deployer = await provider.getSigner();
  const address = await deployer.getAddress();

  console.log("Deploying contracts with:", address);
  const balance = await provider.getBalance(address);
  console.log("Balance:", ethers.formatEther(balance), "AVAX");

  if (balance === 0n) {
    console.error("ERROR: No AVAX balance! Get testnet AVAX from https://faucet.avax.network/");
    process.exit(1);
  }

  // Deploy AgentNFT
  console.log("\n--- Deploying AgentNFT ---");
  const agentNFTArtifact = await hre.artifacts.readArtifact("AgentNFT");
  const AgentNFTFactory = new ethers.ContractFactory(agentNFTArtifact.abi, agentNFTArtifact.bytecode, deployer);
  const agentNFT = await AgentNFTFactory.deploy();
  await agentNFT.waitForDeployment();
  const agentNFTAddress = await agentNFT.getAddress();
  console.log("AgentNFT deployed to:", agentNFTAddress);

  // Deploy SurvivalIsland
  console.log("\n--- Deploying SurvivalIsland ---");
  const survivalArtifact = await hre.artifacts.readArtifact("SurvivalIsland");
  const SurvivalFactory = new ethers.ContractFactory(survivalArtifact.abi, survivalArtifact.bytecode, deployer);
  const survivalIsland = await SurvivalFactory.deploy(agentNFTAddress);
  await survivalIsland.waitForDeployment();
  const survivalAddress = await survivalIsland.getAddress();
  console.log("SurvivalIsland deployed to:", survivalAddress);

  // Transfer AgentNFT ownership to SurvivalIsland
  console.log("\n--- Transferring AgentNFT ownership ---");
  const agentNFTContract = new ethers.Contract(
    agentNFTAddress,
    ["function transferOwnership(address newOwner)"],
    deployer
  );
  const tx = await agentNFTContract.transferOwnership(survivalAddress);
  await tx.wait();
  console.log("AgentNFT ownership transferred to SurvivalIsland");

  console.log("\n========================================");
  console.log("Deployment Summary:");
  console.log("========================================");
  console.log(`NEXT_PUBLIC_AGENT_NFT_ADDRESS=${agentNFTAddress}`);
  console.log(`NEXT_PUBLIC_SURVIVAL_ISLAND_ADDRESS=${survivalAddress}`);
  console.log("========================================");
  console.log("\nAdd these to your .env file!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
