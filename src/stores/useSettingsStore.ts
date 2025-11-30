import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Display
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh-TW';
  currency: 'USD' | 'TWD';
  
  // Security
  autoLockMinutes: number;
  hideBalances: 'always-show' | 'always-hide' | 'hide-on-start';
  
  // Transaction
  largeTransferThreshold: number; // USD amount that triggers warning
  
  // Setters
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: 'en' | 'zh-TW') => void;
  setCurrency: (currency: 'USD' | 'TWD') => void;
  setAutoLockMinutes: (minutes: number) => void;
  setHideBalances: (mode: 'always-show' | 'always-hide' | 'hide-on-start') => void;
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
