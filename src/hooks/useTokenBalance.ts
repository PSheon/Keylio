"use client";

import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { withRetry } from "@/lib/chain";
import { logError } from "@/lib/errors";
import { ERC20_ABI, formatTokenAmount } from "@/lib/tokens";

// ========================================
// Single Token Balance Hook
// ========================================

/**
 * Fetch a single ERC-20 token balance with retry logic.
 *
 * @param tokenAddress - Token contract address (use ethers.ZeroAddress for native ETH)
 * @param walletAddress - Wallet address to check balance for
 * @returns Query result with balance as bigint
 *
 * @example
 * ```tsx
 * const { data: balance, isLoading } = useTokenBalance(USDT_ADDRESS, walletAddress);
 * ```
 */
export const useTokenBalance = (
  tokenAddress: string | undefined,
  walletAddress: string | undefined
) => {
  return useQuery({
    queryKey: ["tokenBalance", tokenAddress, walletAddress],
    queryFn: async () => {
      if (!tokenAddress || !walletAddress) return BigInt(0);

      return withRetry(async (provider) => {
        // Native ETH balance
        if (tokenAddress === ethers.ZeroAddress) {
          return provider.getBalance(walletAddress);
        }

        // ERC-20 token balance
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        return contract.balanceOf(walletAddress);
      });
    },
    enabled: !!tokenAddress && !!walletAddress,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 3,
  });
};

// ========================================
// Multi Token Balance Hook
// ========================================

/**
 * Fetch multiple token balances in parallel.
 *
 * Uses Promise.all for efficient parallel fetching.
 *
 * @param tokens - Array of token contract addresses
 * @param walletAddress - Wallet address to check balances for
 * @returns Query result with Record<tokenAddress, bigint>
 *
 * @example
 * ```tsx
 * const { data: balances } = useMultiTokenBalance([ETH, USDT, USDC], walletAddress);
 * ```
 */
export const useMultiTokenBalance = (
  tokens: string[],
  walletAddress: string | undefined
) => {
  return useQuery({
    queryKey: ["multiTokenBalance", tokens, walletAddress],
    queryFn: async () => {
      if (!walletAddress || tokens.length === 0) return {};

      return withRetry(async (provider) => {
        const balances: Record<string, bigint> = {};

        await Promise.all(
          tokens.map(async (tokenAddress) => {
            try {
              if (tokenAddress === ethers.ZeroAddress) {
                balances[tokenAddress] = await provider.getBalance(walletAddress);
              } else {
                const contract = new ethers.Contract(
                  tokenAddress,
                  ERC20_ABI,
                  provider
                );
                balances[tokenAddress] = await contract.balanceOf(walletAddress);
              }
            } catch (error) {
              logError(error, { tokenAddress, walletAddress });
              balances[tokenAddress] = BigInt(0);
            }
          })
        );

        return balances;
      });
    },
    enabled: !!walletAddress && tokens.length > 0,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 2,
  });
};

// ========================================
// Portfolio Value Hook
// ========================================

/**
 * Calculate total portfolio value in USD.
 *
 * @param balances - Token balances record from useMultiTokenBalance
 * @param tokens - Token metadata array
 * @returns Query result with total USD value
 *
 * @example
 * ```tsx
 * const { data: totalUSD } = usePortfolioValue(balances, SUPPORTED_TOKENS);
 * ```
 *
 * @todo Integrate with price oracle (e.g., Chainlink, CoinGecko API) for real-time prices
 */
export const usePortfolioValue = (
  balances: Record<string, bigint>,
  tokens: Array<{ address: string; symbol: string; decimals: number }>
) => {
  return useQuery({
    queryKey: ["portfolioValue", balances],
    queryFn: () => {
      let totalUSD = 0;

      tokens.forEach((token) => {
        const balance = balances[token.address];
        if (!balance) return;

        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const numBalance = parseFloat(formattedBalance);

        // TODO: Replace with price oracle integration
        // Stablecoins are assumed 1:1 USD
        if (["USDT", "USDC", "DAI"].includes(token.symbol.toUpperCase())) {
          totalUSD += numBalance;
        } else if (token.symbol.toUpperCase() === "ETH") {
          // Placeholder price - should use real-time price feed
          totalUSD += numBalance * 2000;
        }
      });

      return totalUSD;
    },
    enabled: Object.keys(balances).length > 0,
  });
};
