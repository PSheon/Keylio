import { create } from 'zustand';
import { SubWallet } from '@/lib/storage/db';

interface WalletState {
  isUnlocked: boolean;
  wallets: SubWallet[];
  activeWalletId: number | null;
  tempMnemonic: string | null;
  sessionPassword: string | null;
  
  // Actions
  setUnlocked: (unlocked: boolean) => void;
  setWallets: (wallets: SubWallet[]) => void;
  addWallet: (wallet: SubWallet) => void;
  setActiveWallet: (id: number) => void;
  setTempMnemonic: (mnemonic: string) => void;
  clearTempMnemonic: () => void;
  setSessionPassword: (password: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  isUnlocked: false,
  wallets: [],
  activeWalletId: null,
  tempMnemonic: null,
  sessionPassword: null,

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
  setSessionPassword: (password: string | null) => set({ sessionPassword: password }),
}));
