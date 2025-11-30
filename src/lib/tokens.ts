import { ethers } from "ethers";
import { ACTIVE_CHAIN } from "./chain";

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  /** Ledger ID for crypto icon lookup */
  ledgerId: string;
  /** Ticker symbol for icon fallback */
  ticker: string;
  color: string;
  /** Whether this is a native token (ETH, XPL, etc.) */
  isNative?: boolean;
  /** Network for ERC-20 tokens */
  network?: string;
}

/**
 * Get tokens configured for the active chain
 * Token addresses are sourced from chain.ts configuration
 */
const getChainTokens = (): Record<string, TokenConfig> => {
  const chainTokens = ACTIVE_CHAIN.tokens;
  const nativeSymbol = ACTIVE_CHAIN.symbol; // ETH or XPL

  return {
    // Native token (ETH or XPL depending on chain)
    [nativeSymbol]: {
      address: ethers.ZeroAddress, // Native token uses zero address
      symbol: nativeSymbol,
      name: nativeSymbol === 'XPL' ? 'Plasma' : 'Ethereum',
      decimals: 18,
      ledgerId: nativeSymbol === 'XPL' ? 'ethereum' : 'ethereum', // Use ETH icon for XPL as fallback
      ticker: nativeSymbol,
      color: nativeSymbol === 'XPL' ? '#14B8A6' : '#627EEA',
      isNative: true,
    },
    USDT: {
      address: chainTokens.USDT,
      symbol: "USDT",
      name: "Tether USD",
      decimals: 6,
      ledgerId: "ethereum/erc20/usd_tether__erc20_",
      ticker: "USDT",
      color: "#26A17B",
      network: "ethereum",
    },
    USDC: {
      address: chainTokens.USDC,
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      ledgerId: "ethereum/erc20/usd__coin",
      ticker: "USDC",
      color: "#2775CA",
      network: "ethereum",
    },
  };
};

// Dynamic TOKENS based on active chain
export const TOKENS: Record<string, TokenConfig> = getChainTokens();

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

/** Get native token config for active chain */
export const getNativeToken = (): TokenConfig => {
  const nativeSymbol = Object.keys(TOKENS).find(
    key => TOKENS[key].isNative
  );
  return TOKENS[nativeSymbol || 'ETH'];
};

/** Get stablecoin tokens (USDT, USDC) */
export const getStablecoins = (): TokenConfig[] => {
  return [TOKENS.USDT, TOKENS.USDC].filter(Boolean);
};

/** Get all tokens including native */
export const getAllTokens = (): TokenConfig[] => {
  return Object.values(TOKENS);
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

// NOTE: For USD formatting, use formatUSD from '@/lib/formatters'
// This avoids duplicate implementations

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

  // For native tokens (ETH/XPL), would need price oracle in production
  // Using example rate of $2000/ETH, $0.01/XPL
  const symbol = tokenSymbol.toUpperCase();
  if (symbol === "ETH") {
    return numAmount * 2000;
  }
  if (symbol === "XPL") {
    return numAmount * 0.01; // Placeholder price
  }

  return numAmount;
};
