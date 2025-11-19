import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ethers } from "ethers";
import { useProvider } from "./usePlasma";
import { ERC20_ABI, getTokenBySymbol, formatTokenAmount } from "@/lib/tokens";

/**
 * Hook to fetch ERC-20 token balance
 */
export const useTokenBalance = (
  tokenAddress: string | undefined,
  walletAddress: string | undefined
) => {
  const provider = useProvider();

  return useQuery({
    queryKey: ["tokenBalance", tokenAddress, walletAddress],
    queryFn: async () => {
      if (!tokenAddress || !walletAddress) return BigInt(0);

      // Native ETH balance
      if (tokenAddress === "0x0000000000000000000000000000000000000000") {
        return await provider.getBalance(walletAddress);
      }

      // ERC-20 token balance
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await contract.balanceOf(walletAddress);
      return balance;
    },
    enabled: !!tokenAddress && !!walletAddress,
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

/**
 * Hook to fetch multiple token balances at once
 */
export const useMultiTokenBalance = (
  tokens: string[],
  walletAddress: string | undefined
) => {
  const provider = useProvider();

  return useQuery({
    queryKey: ["multiTokenBalance", tokens, walletAddress],
    queryFn: async () => {
      if (!walletAddress || tokens.length === 0) return {};

      const balances: Record<string, bigint> = {};

      await Promise.all(
        tokens.map(async (tokenAddress) => {
          try {
            if (tokenAddress === "0x0000000000000000000000000000000000000000") {
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
            console.error(`Error fetching balance for ${tokenAddress}:`, error);
            balances[tokenAddress] = BigInt(0);
          }
        })
      );

      return balances;
    },
    enabled: !!walletAddress && tokens.length > 0,
    refetchInterval: 10000,
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
