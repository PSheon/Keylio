import { ethers } from "ethers";

// ========================================
// Chain Configuration
// ========================================

export interface ChainConfig {
  chainId: number;
  name: string;
  displayName: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  color: string; // Brand color for UI
}

// Alchemy API Key from environment
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

// ========================================
// Supported Chains
// ========================================

export const CHAINS: Record<string, ChainConfig> = {
  // Ethereum Mainnet
  'eth-mainnet': {
    chainId: 1,
    name: 'eth-mainnet',
    displayName: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: ALCHEMY_API_KEY 
      ? `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      : 'https://ethereum-rpc.publicnode.com',
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    color: '#627EEA',
  },
  
  // Ethereum Sepolia Testnet
  'eth-sepolia': {
    chainId: 11155111,
    name: 'eth-sepolia',
    displayName: 'Ethereum Sepolia',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: ALCHEMY_API_KEY
      ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
      : 'https://ethereum-sepolia-rpc.publicnode.com',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    color: '#627EEA',
  },
  
  // Plasma Mainnet
  'plasma-mainnet': {
    chainId: 9745,
    name: 'plasma-mainnet',
    displayName: 'Plasma Network',
    symbol: 'XPL', // Native token symbol
    decimals: 18,
    rpcUrl: process.env.NEXT_PUBLIC_PLASMA_MAINNET_RPC || 'https://rpc.plasm.finance',
    explorerUrl: 'https://explorer.plasm.finance',
    isTestnet: false,
    color: '#14B8A6', // Teal color
  },
  
  // Plasma Testnet
  'plasma-testnet': {
    chainId: 9746, // Testnet chain ID (please verify if different)
    name: 'plasma-testnet',
    displayName: 'Plasma Testnet',
    symbol: 'XPL',
    decimals: 18,
    rpcUrl: process.env.NEXT_PUBLIC_PLASMA_TESTNET_RPC || 'https://testnet-rpc.plasm.finance',
    explorerUrl: 'https://testnet-explorer.plasm.finance',
    isTestnet: true,
    color: '#14B8A6',
  },
};

// ========================================
// Active Chain Selection
// ========================================

// Get active chain from environment variable
const getActiveChainName = (): string => {
  const envChain = process.env.NEXT_PUBLIC_CHAIN_NAME;
  
  // Validate chain exists
  if (envChain && CHAINS[envChain]) {
    return envChain;
  }
  
  // Default to Ethereum Sepolia if no chain specified
  return 'eth-sepolia';
};

export const ACTIVE_CHAIN_NAME = getActiveChainName();
export const ACTIVE_CHAIN = CHAINS[ACTIVE_CHAIN_NAME];

// ========================================
// Backward Compatibility Exports
// ========================================

export const PLASMA_CHAIN_ID = ACTIVE_CHAIN.chainId;
export const PLASMA_RPC_URL = ACTIVE_CHAIN.rpcUrl;
export const PLASMA_SYMBOL = ACTIVE_CHAIN.symbol;
export const PLASMA_EXPLORER = ACTIVE_CHAIN.explorerUrl;

// ========================================
// Provider Management
// ========================================

let providerCache: ethers.JsonRpcProvider | null = null;

/**
 * Get the JSON-RPC provider for the active chain
 * Uses caching to avoid creating multiple provider instances
 */
export const getProvider = (): ethers.JsonRpcProvider => {
  if (!providerCache) {
    providerCache = new ethers.JsonRpcProvider(ACTIVE_CHAIN.rpcUrl, {
      chainId: ACTIVE_CHAIN.chainId,
      name: ACTIVE_CHAIN.displayName,
    });
  }
  return providerCache;
};

/**
 * Get a provider for a specific chain
 */
export const getProviderForChain = (chainName: string): ethers.JsonRpcProvider => {
  const chain = CHAINS[chainName];
  if (!chain) {
    throw new Error(`Unknown chain: ${chainName}`);
  }
  
  return new ethers.JsonRpcProvider(chain.rpcUrl, {
    chainId: chain.chainId,
    name: chain.displayName,
  });
};

// ========================================
// Utility Functions
// ========================================

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
