/**
 * Keylio Wallet - Settings Store
 *
 * Manages user preferences with localStorage persistence.
 * Uses Zustand with persist middleware.
 *
 * @example
 * ```tsx
 * // Single selector (recommended for performance)
 * const theme = useSettingsStore((state) => state.theme);
 *
 * // Multiple selectors with useShallow
 * import { useShallow } from 'zustand/react/shallow';
 * const { theme, language } = useSettingsStore(
 *   useShallow((state) => ({ theme: state.theme, language: state.language }))
 * );
 * ```
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ========================================
// Types
// ========================================

/** Supported themes */
export type Theme = 'light' | 'dark' | 'system';

/** Supported languages */
export type Language = 'en' | 'zh-TW';

/** Supported currencies */
export type Currency = 'USD' | 'TWD';

/** Balance visibility mode */
export type HideBalancesMode = 'always-show' | 'always-hide' | 'hide-on-start';

export interface SettingsState {
  // Display
  theme: Theme;
  language: Language;
  currency: Currency;

  // Security
  autoLockMinutes: number;
  hideBalances: HideBalancesMode;

  // Transaction
  /** USD amount that triggers large transfer warning */
  largeTransferThreshold: number;

  // Setters
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
  setAutoLockMinutes: (minutes: number) => void;
  setHideBalances: (mode: HideBalancesMode) => void;
  setLargeTransferThreshold: (amount: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      theme: 'dark',
      language: 'zh-TW',
      currency: 'USD',
      autoLockMinutes: 15,
      hideBalances: 'always-show',
      largeTransferThreshold: 1000, // Default $1000 USD warning

      // Setters
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
      setHideBalances: (hideBalances) => set({ hideBalances }),
      setLargeTransferThreshold: (largeTransferThreshold) => set({ largeTransferThreshold }),
    }),
    {
      name: 'keylio-settings',
    }
  )
);

// ========================================
// Selectors (for common use cases)
// ========================================

/** Select theme setting */
export const selectTheme = (state: SettingsState) => state.theme;

/** Select language setting */
export const selectLanguage = (state: SettingsState) => state.language;

/** Select currency setting */
export const selectCurrency = (state: SettingsState) => state.currency;

/** Select auto-lock minutes */
export const selectAutoLockMinutes = (state: SettingsState) => state.autoLockMinutes;

/** Select hide balances mode */
export const selectHideBalances = (state: SettingsState) => state.hideBalances;

/** Select large transfer threshold */
export const selectLargeTransferThreshold = (state: SettingsState) => state.largeTransferThreshold;
