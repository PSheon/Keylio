import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh-TW';
  currency: 'USD' | 'TWD';
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: 'en' | 'zh-TW') => void;
  setCurrency: (currency: 'USD' | 'TWD') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark', // Default to dark as per spec
      language: 'zh-TW', // Default to Traditional Chinese
      currency: 'USD',

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'keylio-settings', // name of the item in the storage (must be unique)
    }
  )
);
