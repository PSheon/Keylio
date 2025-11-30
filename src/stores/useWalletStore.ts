/**
 * Keylio Wallet - Wallet Store
 *
 * Manages wallet state including:
 * - Unlock status
 * - Sub-wallets list
 * - Active wallet selection
 * - Session management integration
 *
 * @example
 * ```tsx
 * // Using pre-built selector hook (recommended)
 * import { useActiveWallet } from '@/hooks';
 * const { activeWallet, wallets } = useActiveWallet();
 *
 * // Direct store access
 * const isUnlocked = useWalletStore((state) => state.isUnlocked);
 * ```
 */

import { create } from 'zustand';
import { sessionManager } from '@/lib/session';
import { type SubWallet } from '@/lib/storage/db';

// ========================================
// Types
// ========================================

/** Application view states */
export type AppView = 'loading' | 'welcome' | 'philosophy' | 'setup' | 'unlock' | 'dashboard';

export interface WalletState {
  isUnlocked: boolean;
  wallets: SubWallet[];
  activeWalletId: number | null;
  tempMnemonic: string | null;
  viewOverride: AppView | null; // For manual view navigation

  // Actions
  setUnlocked: (unlocked: boolean) => void;
  setWallets: (wallets: SubWallet[]) => void;
  addWallet: (wallet: SubWallet) => void;
  setActiveWallet: (id: number) => void;
  setTempMnemonic: (mnemonic: string) => void;
  clearTempMnemonic: () => void;
  getCurrentWallet: () => SubWallet | null;
  setViewOverride: (view: AppView | null) => void;

  // Session management
  createSession: (password: string) => Promise<void>;
  destroySession: () => void;
  isSessionActive: () => boolean;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  isUnlocked: false,
  wallets: [],
  activeWalletId: null,
  tempMnemonic: null,
  viewOverride: null,

  setUnlocked: (unlocked) => set({ isUnlocked: unlocked }),

  setWallets: (wallets) => set((state) => ({
    wallets,
    // If no active wallet is set, set the first one as active
    activeWalletId: state.activeWalletId ?? (wallets.length > 0 ? wallets[0].id! : null)
  })),

  addWallet: (wallet) => set((state) => ({
    wallets: [...state.wallets, wallet],
    activeWalletId: state.activeWalletId ?? wallet.id!
  })),

  setActiveWallet: (id) => set({ activeWalletId: id }),
  setTempMnemonic: (mnemonic) => set({ tempMnemonic: mnemonic }),
  clearTempMnemonic: () => set({ tempMnemonic: null }),
  setViewOverride: (view) => set({ viewOverride: view }),

  // Get the current active wallet
  getCurrentWallet: () => {
    const state = get();
    return state.wallets.find(w => w.id === state.activeWalletId) || null;
  },

  // Create a secure session with the password
  createSession: async (password: string) => {
    await sessionManager.createSession(password);
    set({ isUnlocked: true });
  },

  // Destroy the session and lock the wallet
  destroySession: () => {
    // Pass notify=false to prevent circular callback
    sessionManager.destroy(false);
    // Reset view override so it goes back to unlock screen
    set({ isUnlocked: false, tempMnemonic: null, viewOverride: null });
  },

  // Check if the session is still active
  isSessionActive: () => {
    return sessionManager.isActive();
  },
}));

// ========================================
// Session Manager Configuration
// ========================================

/**
 * Configure session manager to auto-lock wallet when session expires.
 * This runs once when the module is loaded.
 */
sessionManager.configure({
  autoLockMinutes: 15, // 15 minutes default
  onSessionExpired: () => {
    useWalletStore.getState().destroySession();
  },
});

// ========================================
// Selectors
// ========================================

/** Select unlock status */
export const selectIsUnlocked = (state: WalletState) => state.isUnlocked;

/** Select all wallets */
export const selectWallets = (state: WalletState) => state.wallets;

/** Select active wallet ID */
export const selectActiveWalletId = (state: WalletState) => state.activeWalletId;

/** Select current view override */
export const selectViewOverride = (state: WalletState) => state.viewOverride;

/** Select active wallet object */
export const selectActiveWallet = (state: WalletState) => {
  return state.wallets.find((w) => w.id === state.activeWalletId) || null;
};
