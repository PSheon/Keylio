"use client";

import { useEffect, useState } from "react";
import { useWalletStore } from "@/stores/useWalletStore";
import db from "@/lib/storage/db";
import { useLiveQuery } from "dexie-react-hooks";
import { WelcomeScreen } from "@/components/wallet/WelcomeScreen";
import { WalletSetupWizard } from "@/components/wallet/WalletSetupWizard";
import { BackupFlow } from "@/components/wallet/BackupFlow";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { AssetOverview } from "@/components/wallet/AssetOverview";
import { WalletList } from "@/components/wallet/WalletList";
import { TransactionHistory } from "@/components/transaction/TransactionHistory";
import { UnlockScreen } from "@/components/wallet/UnlockScreen";

export default function Home() {
  const [view, setView] = useState<'loading' | 'welcome' | 'setup' | 'backup' | 'unlock' | 'dashboard'>('loading');
  const setWallets = useWalletStore((state) => state.setWallets);
  const isUnlocked = useWalletStore((state) => state.isUnlocked);

  // Check if wallet exists
  const subWallets = useLiveQuery(() => db.sub_wallets.toArray());

  useEffect(() => {
    if (subWallets === undefined) return; // Loading

    if (subWallets.length > 0) {
      setWallets(subWallets);
      if (isUnlocked) {
        setView('dashboard');
      } else {
        setView('unlock');
      }
    } else {
      setView('welcome');
    }
  }, [subWallets, setWallets, isUnlocked]);

  if (view === 'loading') {
    return <div className="min-h-screen bg-keylio-bg-primary flex items-center justify-center text-keylio-text-primary">Loading...</div>;
  }

  if (view === 'welcome') {
    return <WelcomeScreen onComplete={() => setView('setup')} />;
  }

  if (view === 'setup') {
    return <WalletSetupWizard onComplete={() => setView('backup')} />;
  }

  if (view === 'backup') {
    return <BackupFlow onComplete={() => setView('dashboard')} />;
  }

  if (view === 'unlock') {
    return <UnlockScreen onUnlock={() => setView('dashboard')} />;
  }

  return (
    <DashboardLayout>
      <AssetOverview />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-keylio-text-primary">我的子錢包</h3>
        </div>
        <WalletList />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-keylio-text-primary">近期交易</h3>
        <TransactionHistory />
      </div>
    </DashboardLayout>
  );
}
