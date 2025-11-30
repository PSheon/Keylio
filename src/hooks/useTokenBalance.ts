import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { withRetry } from "@/lib/chain";
import { ERC20_ABI, formatTokenAmount } from "@/lib/tokens";
import { logError } from "@/lib/errors";

/**
 * Hook to fetch ERC-20 token balance with retry logic
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

/**
 * Hook to fetch multiple token balances at once
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

/**
 * Hook to get total portfolio value in USD
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

        // Simple price conversion (in production, use price oracle)
        if (["USDT", "USDC", "DAI"].includes(token.symbol.toUpperCase())) {
          totalUSD += numBalance;
        } else if (token.symbol.toUpperCase() === "ETH") {
          totalUSD += numBalance * 2000; // Example ETH price
        }
      });

      return totalUSD;
    },
    enabled: Object.keys(balances).length > 0,
  });
};

export default useTokenBalance;
