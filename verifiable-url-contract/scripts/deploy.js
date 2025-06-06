const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying VerifiableURL contract to Sepolia...");

  // Get the ContractFactory and Signers
  const VerifiableURL = await ethers.getContractFactory("VerifiableURL");
  
  // Deploy the contract
  const verifiableURL = await VerifiableURL.deploy();
  
  // Wait for deployment to complete
  await verifiableURL.waitForDeployment();
  
  const contractAddress = await verifiableURL.getAddress();
  
  console.log("✅ VerifiableURL deployed to:", contractAddress);
  console.log("📝 Update your .env file with:");
  console.log(`CONTRACT_ADDRESS="${contractAddress}"`);
  
  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const owner = await verifiableURL.owner();
  console.log("Contract owner:", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
