import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.30",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    somnia: {
      url: "https://dream-rpc.somnia.network",
      chainId: 50312,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: { somnia: "empty" },
    customChains: [
      {
        network: "somnia",
        chainId: 50312,
        urls: {
          apiURL: "https://shannon-explorer.somnia.network/api",
          browserURL: "https://shannon-explorer.somnia.network",
        },
      },
    ],
  },
};

export default config;
