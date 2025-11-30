import { ethers } from "ethers";

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  color: string;
}

// Sepolia Testnet Token Addresses
// Note: These are example addresses. For production, use actual deployed token contracts
export const TOKENS: Record<string, TokenConfig> = {
  ETH: {
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    icon: "💎",
    color: "#627EEA",
  },
  USDT: {
    address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0", // Sepolia USDT (example)
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    icon: "💵",
    color: "#26A17B",
  },
  USDC: {
    address: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Sepolia USDC (example)
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    icon: "💰",
    color: "#2775CA",
  },
  DAI: {
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", // Sepolia DAI (example)
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    icon: "🟡",
    color: "#F4B731",
  },
};

// ERC-20 ABI (minimal interface for balance and transfer)
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const getTokenByAddress = (address: string): TokenConfig | undefined => {
  return Object.values(TOKENS).find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
};

export const getTokenBySymbol = (symbol: string): TokenConfig | undefined => {
  return TOKENS[symbol.toUpperCase()];
};

export const formatTokenAmount = (
  amount: bigint | string,
  decimals: number = 18
): string => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (
  amount: string,
  decimals: number = 18
): bigint => {
  return ethers.parseUnits(amount, decimals);
};

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// For stablecoins, 1 token ≈ 1 USD
export const getTokenValueUSD = (
  amount: string,
  tokenSymbol: string
): number => {
  const numAmount = parseFloat(amount);

  // For stablecoins, assume 1:1 with USD
  if (["USDT", "USDC", "DAI"].includes(tokenSymbol.toUpperCase())) {
    return numAmount;
  }

  // For ETH, would need price oracle in production
  // Using example rate of $2000/ETH
  if (tokenSymbol.toUpperCase() === "ETH") {
    return numAmount * 2000;
  }

  return numAmount;
};

export const getAllTokens = (): TokenConfig[] => {
  return Object.values(TOKENS);
};

export const getStablecoins = (): TokenConfig[] => {
  return Object.values(TOKENS).filter((token) =>
    ["USDT", "USDC", "DAI"].includes(token.symbol)
  );
};
