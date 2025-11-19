import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { PLASMA_RPC_URL } from "@/lib/chain";

// Singleton provider instance
let provider: ethers.JsonRpcProvider | null = null;

export const useProvider = () => {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(PLASMA_RPC_URL);
  }
  return provider;
};

export const useBalance = (address: string | undefined) => {
  const provider = useProvider();

  return useQuery({
    queryKey: ["balance", address],
    queryFn: async () => {
      if (!address) return BigInt(0);
      // Return balance as BigInt, not formatted string
      const balance = await provider.getBalance(address);
      return balance;
    },
    enabled: !!address,
    refetchInterval: 10000, // Poll every 10 seconds
  });
};
