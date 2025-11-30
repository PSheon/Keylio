/**
 * Keylio Wallet - Stores
 *
 * Centralized state management using Zustand.
 *
 * @module stores
 */

// ========================================
// Settings Store
// ========================================
export {
  useSettingsStore,
  // Types
  type Theme,
  type Language,
  type Currency,
  type HideBalancesMode,
  type SettingsState,
  // Selectors
  selectTheme,
  selectLanguage,
  selectCurrency,
  selectAutoLockMinutes,
  selectHideBalances,
  selectLargeTransferThreshold,
} from "./useSettingsStore";

// ========================================
// Wallet Store
// ========================================
export {
  useWalletStore,
  // Types
  type AppView,
  type WalletState,
  // Selectors
  selectIsUnlocked,
  selectWallets,
  selectActiveWalletId,
  selectViewOverride,
  selectActiveWallet,
} from "./useWalletStore";
