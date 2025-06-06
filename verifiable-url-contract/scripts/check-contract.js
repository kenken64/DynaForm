const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress || contractAddress === "deployed_contract_address") {
    console.log("❌ No contract address found in .env file");
    return;
  }
  
  console.log("Checking contract at address:", contractAddress);
  
  // Check if there's code at the address
  const code = await ethers.provider.getCode(contractAddress);
  
  if (code === "0x") {
    console.log("❌ No contract deployed at this address");
    console.log("The address exists but has no contract code");
  } else {
    console.log("✅ Contract found at address!");
    console.log("Contract bytecode length:", code.length, "characters");
    
    // Try to interact with the contract
    try {
      const VerifiableURL = await ethers.getContractFactory("VerifiableURL");
      const contract = VerifiableURL.attach(contractAddress);
      
      const owner = await contract.owner();
      console.log("Contract owner:", owner);
      console.log("✅ Contract is functional and deployed!");
    } catch (error) {
      console.log("⚠️  Contract exists but may not match current ABI:");
      console.log(error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error checking contract:");
    console.error(error);
    process.exit(1);
  });
