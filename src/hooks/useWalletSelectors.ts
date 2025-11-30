"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWalletStore } from "@/stores/useWalletStore";

/**
 * Pre-defined selector for active wallet.
 *
 * Returns current active wallet with memoized lookup.
 * Uses shallow comparison to prevent unnecessary re-renders.
 *
 * @example
 * ```tsx
 * const { activeWallet, wallets } = useActiveWallet();
 * if (activeWallet) {
 *   console.log('Active:', activeWallet.name);
 * }
 * ```
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
