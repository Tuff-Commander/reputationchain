const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying ReputationChain to Moonbase Alpha...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "DEV");

  const ReputationChain = await hre.ethers.getContractFactory("ReputationChain");
  const reputationChain = await ReputationChain.deploy();

  await reputationChain.waitForDeployment();

  const contractAddress = await reputationChain.getAddress();
  
  console.log("✅ ReputationChain deployed to:", contractAddress);
  console.log("Save this address to your frontend!");
  
  // Create deployment info file
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: "moonbase",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };
  
  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("📝 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });