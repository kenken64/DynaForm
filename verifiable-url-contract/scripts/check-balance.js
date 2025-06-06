const { ethers } = require("hardhat");

async function main() {
  console.log("Checking account balance...");
  
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log("Account address:", address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  const minBalance = ethers.parseEther("0.01"); // Minimum 0.01 ETH needed
  
  if (balance < minBalance) {
    console.log("❌ Insufficient balance for deployment!");
    console.log("You need at least 0.01 ETH on Sepolia testnet.");
    console.log("Get free Sepolia ETH from:");
    console.log("- https://faucet.sepolia.dev/");
    console.log("- https://sepoliafaucet.com/");
    console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
  } else {
    console.log("✅ Sufficient balance for deployment!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error checking balance:");
    console.error(error);
    process.exit(1);
  });
