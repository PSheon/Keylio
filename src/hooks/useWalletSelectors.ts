import { useShallow } from "zustand/react/shallow";
import { useWalletStore } from "@/stores/useWalletStore";
import { useMemo } from "react";

/**
 * Pre-defined selector for active wallet
 * Returns current active wallet with memoized lookup
 */
export function useActiveWallet() {
  const { wallets, activeWalletId } = useWalletStore(
    useShallow((state) => ({
      wallets: state.wallets,
      activeWalletId: state.activeWalletId,
    }))
  );
  
  const activeWallet = useMemo(() => {
    return wallets.find((w) => w.id === activeWalletId) || null;
  }, [wallets, activeWalletId]);
  
  return { wallets, activeWalletId, activeWallet };
}

