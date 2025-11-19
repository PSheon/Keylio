import { ethers } from "ethers";

// Using Ethereum Sepolia Testnet for demonstration
// For production, replace with your Alchemy/Infura API key
export const PLASMA_CHAIN_ID = 11155111; // Sepolia Chain ID
export const PLASMA_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
export const PLASMA_SYMBOL = "ETH";
export const PLASMA_EXPLORER = "https://sepolia.etherscan.io";

export const formatBalance = (balance: string | bigint, decimals: number = 18): string => {
  return ethers.formatUnits(balance, decimals);
};

export const parseBalance = (amount: string, decimals: number = 18): bigint => {
  return ethers.parseUnits(amount, decimals);
};

export const shortenAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
