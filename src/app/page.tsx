"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useWalletStore } from "@/stores/useWalletStore";
import db from "@/lib/storage/db";
import { useLiveQuery } from "dexie-react-hooks";
import { WelcomeScreen } from "@/components/wallet/WelcomeScreen";
import { WalletSetupWizard } from "@/components/wallet/WalletSetupWizard";
import { BackupFlow } from "@/components/wallet/BackupFlow";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import AssetOverview from "@/components/wallet/AssetOverview";
import QuickActions from "@/components/wallet/QuickActions";
import TransactionHistory from "@/components/transaction/TransactionHistory";
import { UnlockScreen } from "@/components/wallet/UnlockScreen";
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Lazy load StatisticsPanel (below the fold)
const StatisticsPanel = lazy(() => import("@/components/analytics/StatisticsPanel"));

export default function Home() {
  const [view, setView] = useState<'loading' | 'welcome' | 'setup' | 'backup' | 'unlock' | 'dashboard'>('loading');
  const setWallets = useWalletStore((state) => state.setWallets);
  const isUnlocked = useWalletStore((state) => state.isUnlocked);
  const wallets = useWalletStore((state) => state.wallets);

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
      <ErrorBoundary>
        {/* 1. Main Balance - 80% Above the Fold */}
        <AssetOverview />
        
        {/* 2. Quick Actions - Primary CTA */}
        <QuickActions address={wallets[0]?.address || ""} />

        {/* 3. Recent Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-keylio-text-primary">近期交易</h3>
            <span className="text-xs text-keylio-text-secondary">最近 10 筆</span>
          </div>
          <TransactionHistory />
        </div>

        {/* 4. Statistics Panel - Collapsible */}
        <Suspense fallback={
          <div className="bg-keylio-bg-secondary rounded-xl border border-keylio-border-primary p-6 animate-pulse">
            <div className="h-6 bg-keylio-bg-tertiary rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-keylio-bg-tertiary rounded w-full"></div>
              <div className="h-4 bg-keylio-bg-tertiary rounded w-5/6"></div>
            </div>
          </div>
        }>
          <StatisticsPanel />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
}
