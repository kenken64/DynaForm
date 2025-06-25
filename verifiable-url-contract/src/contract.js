const { ethers } = require('ethers');
const config = require('./config');

// Try to load the contract artifact
let VerifiableURL;
try {
  VerifiableURL = require('../artifacts/contracts/VerifiableURL.sol/VerifiableURL.json');
} catch (error) {
  console.error('Failed to load contract artifact. Make sure contracts are compiled with "npm run compile"');
  console.error('Error:', error.message);
  process.exit(1);
}

// Check if environment variables are properly configured
const isConfigured = () => {
  return config.PRIVATE_KEY && 
         config.PRIVATE_KEY !== 'your_metamask_private_key' && 
         config.PRIVATE_KEY.length === 66 &&
         config.CONTRACT_ADDRESS && 
         config.CONTRACT_ADDRESS !== 'deployed_contract_address' &&
         config.PROVIDER_URL && 
         !config.PROVIDER_URL.includes('your_api_key');
};

let provider, wallet, contract;

if (isConfigured()) {
  provider = new ethers.JsonRpcProvider(config.PROVIDER_URL);
  wallet = new ethers.Wallet(config.PRIVATE_KEY, provider);
  contract = new ethers.Contract(
    config.CONTRACT_ADDRESS,
    VerifiableURL.abi,
    wallet
  );
} else {
  console.warn('⚠️  Contract not configured. Please update your .env file with:');
  console.warn('   - PRIVATE_KEY: Your MetaMask private key');
  console.warn('   - CONTRACT_ADDRESS: Your deployed contract address');
  console.warn('   - PROVIDER_URL: Your Alchemy API URL with valid API key');
}

async function addURL(url) {
  if (!contract) {
    throw new Error('Contract not configured. Please update your .env file.');
  }
  const tx = await contract.addURL(url);
  return tx;
}

async function verifyURL(url) {
  if (!contract) {
    throw new Error('Contract not configured. Please update your .env file.');
  }
  return await contract.verifyURL(url);
}

async function getContractStatus() {
  return {
    configured: isConfigured(),
    hasPrivateKey: !!(config.PRIVATE_KEY && config.PRIVATE_KEY !== 'your_metamask_private_key'),
    hasContractAddress: !!(config.CONTRACT_ADDRESS && config.CONTRACT_ADDRESS !== 'deployed_contract_address'),
    hasProviderUrl: !!(config.PROVIDER_URL && !config.PROVIDER_URL.includes('your_api_key'))
  };
}

module.exports = { addURL, verifyURL, getContractStatus };