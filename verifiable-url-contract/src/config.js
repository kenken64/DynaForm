require('dotenv').config();

module.exports = {
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  PROVIDER_URL: process.env.PROVIDER_URL || 'https://eth-sepolia.g.alchemy.com/v2/your_api_key',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS
};