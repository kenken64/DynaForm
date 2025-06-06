require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROVIDER_URL = process.env.PROVIDER_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: PROVIDER_URL || "https://eth-sepolia.g.alchemy.com/v2/your_api_key",
      accounts: PRIVATE_KEY && PRIVATE_KEY !== "your_metamask_private_key" && PRIVATE_KEY.length === 66 
        ? [PRIVATE_KEY] 
        : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};
