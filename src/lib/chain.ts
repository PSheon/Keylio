import { ethers } from "ethers";
import { KeylioError, ErrorCode } from "./errors";

// ========================================
// Chain Configuration
// ========================================

/** Token contract addresses for a chain */
export interface ChainTokenAddresses {
  USDT: string;
  USDC: string;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  displayName: string;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  fallbackRpcUrls?: string[];
  explorerUrl: string;
  isTestnet: boolean;
  color: string; // Brand color for UI
  /** Token contract addresses */
  tokens: ChainTokenAddresses;
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
    fallbackRpcUrls: [
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.ankr.com/eth',
      'https://1rpc.io/eth',
    ],
    explorerUrl: 'https://etherscan.io',
    isTestnet: false,
    color: '#627EEA',
    tokens: {
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Mainnet USDT
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet USDC
    },
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
    fallbackRpcUrls: [
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.ankr.com/eth_sepolia',
      'https://rpc.sepolia.org',
    ],
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    color: '#627EEA',
    tokens: {
      USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0', // Sepolia USDT
      USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // Sepolia USDC
    },
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
    tokens: {
      USDT: '0x0000000000000000000000000000000000000000', // TODO: Add Plasma USDT address
      USDC: '0x0000000000000000000000000000000000000000', // TODO: Add Plasma USDC address
    },
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
    tokens: {
      USDT: '0x0000000000000000000000000000000000000000', // TODO: Add Plasma Testnet USDT address
      USDC: '0x0000000000000000000000000000000000000000', // TODO: Add Plasma Testnet USDC address
    },
  },
};

/**
 * Get token addresses for the active chain
 */
export const getActiveChainTokens = (): ChainTokenAddresses => {
  return ACTIVE_CHAIN.tokens;
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

interface ProviderState {
  provider: ethers.JsonRpcProvider;
  rpcUrl: string;
  isHealthy: boolean;
  lastHealthCheck: number;
}

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const REQUEST_TIMEOUT = 10000; // 10 seconds

let providerState: ProviderState | null = null;

/**
 * Creates a provider with the given RPC URL
 */
function createProvider(rpcUrl: string, chainConfig: ChainConfig): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl, {
    chainId: chainConfig.chainId,
    name: chainConfig.displayName,
  });
}

/**
 * Check if a provider is healthy by making a simple request
 */
async function checkProviderHealth(provider: ethers.JsonRpcProvider): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    await Promise.race([
      provider.getBlockNumber(),
      new Promise((_, reject) =>
        controller.signal.addEventListener('abort', () =>
          reject(new Error('Health check timeout'))
        )
      )
    ]);

    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find a working RPC URL from the chain config
 */
async function findWorkingRpc(chainConfig: ChainConfig): Promise<string> {
  const urls = [chainConfig.rpcUrl, ...(chainConfig.fallbackRpcUrls || [])];

  for (const url of urls) {
    const testProvider = createProvider(url, chainConfig);
    if (await checkProviderHealth(testProvider)) {
      return url;
    }
  }

  // If all fail, return primary URL anyway
  return chainConfig.rpcUrl;
}

/**
 * Get the JSON-RPC provider for the active chain
 * Includes automatic fallback and health checking
 */
export const getProvider = async (): Promise<ethers.JsonRpcProvider> => {
  const now = Date.now();

  // Return cached provider if healthy
  if (providerState && providerState.isHealthy) {
    // Periodic health check
    if (now - providerState.lastHealthCheck > HEALTH_CHECK_INTERVAL) {
      providerState.isHealthy = await checkProviderHealth(providerState.provider);
      providerState.lastHealthCheck = now;

      if (!providerState.isHealthy) {
        // Provider became unhealthy, try to find a new one
        const workingRpc = await findWorkingRpc(ACTIVE_CHAIN);
        providerState = {
          provider: createProvider(workingRpc, ACTIVE_CHAIN),
          rpcUrl: workingRpc,
          isHealthy: true,
          lastHealthCheck: now,
        };
      }
    }
    return providerState.provider;
  }

  // Create new provider
  const workingRpc = await findWorkingRpc(ACTIVE_CHAIN);
  providerState = {
    provider: createProvider(workingRpc, ACTIVE_CHAIN),
    rpcUrl: workingRpc,
    isHealthy: true,
    lastHealthCheck: now,
  };

  return providerState.provider;
};

/**
 * Get provider synchronously (may not be the healthiest)
 * Use this only when you can't await
 */
export const getProviderSync = (): ethers.JsonRpcProvider => {
  if (providerState) {
    return providerState.provider;
  }

  const provider = createProvider(ACTIVE_CHAIN.rpcUrl, ACTIVE_CHAIN);
  providerState = {
    provider,
    rpcUrl: ACTIVE_CHAIN.rpcUrl,
    isHealthy: true,
    lastHealthCheck: Date.now(),
  };

  return provider;
};

/**
 * Get a provider for a specific chain
 */
export const getProviderForChain = (chainName: string): ethers.JsonRpcProvider => {
  const chain = CHAINS[chainName];
  if (!chain) {
    throw new KeylioError(ErrorCode.NETWORK_CHAIN_MISMATCH, { chainName });
  }

  return createProvider(chain.rpcUrl, chain);
};

/**
 * Execute a provider call with retry logic
 */
export async function withRetry<T>(
  fn: (provider: ethers.JsonRpcProvider) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const provider = await getProvider();
      return await fn(provider);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Mark provider as unhealthy and try again
      if (providerState) {
        providerState.isHealthy = false;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new KeylioError(
    ErrorCode.NETWORK_RPC_ERROR,
    { attempts: maxRetries },
    lastError || undefined
  );
}

// ========================================
// Utility Functions
// ========================================

export const formatBalance = (balance: string | bigint, decimals: number = 18): string => {
  return ethers.formatUnits(balance, decimals);
};

export const parseBalance = (amount: string, decimals: number = 18): bigint => {
  return ethers.parseUnits(amount, decimals);
};

// NOTE: For address shortening, use shortenAddress from '@/lib/formatters'
// This avoids duplicate implementations
