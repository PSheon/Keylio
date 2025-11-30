"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { LoadingScreen } from "@/components/wallet/LoadingScreen";
import { PhilosophyScreen } from "@/components/wallet/PhilosophyScreen";
import { PortfolioHome } from "@/components/wallet/PortfolioHome";
import { UnlockScreen } from "@/components/wallet/UnlockScreen";
import { WalletSetupWizard } from "@/components/wallet/WalletSetupWizard";
import { WelcomeScreen } from "@/components/wallet/WelcomeScreen";
import db from "@/lib/storage/db";
import { useWalletStore } from "@/stores/useWalletStore";

// Flow per Spec Phase 1:
// welcome (logo animation) → philosophy (brand message) → setup (password + passkey) → dashboard
type AppView = 'loading' | 'welcome' | 'philosophy' | 'setup' | 'unlock' | 'dashboard';

export default function Home() {
  const viewOverride = useWalletStore((state) => state.viewOverride);
  const setViewOverride = useWalletStore((state) => state.setViewOverride);
  const initialized = useRef(false);

  const setWallets = useWalletStore((state) => state.setWallets);
  const isUnlocked = useWalletStore((state) => state.isUnlocked);

  // Check if wallet exists
  const subWallets = useLiveQuery(() => db.sub_wallets.toArray());

  // Compute initial view based on wallet state (no setState in effect)
  const computedInitialView = useMemo<AppView | null>(() => {
    if (subWallets === undefined) return null; // Still loading
    if (subWallets.length === 0) return 'welcome';
    return isUnlocked ? 'dashboard' : 'unlock';
  }, [subWallets, isUnlocked]);

  // Initialize wallets ONCE (no setState for view)
  useEffect(() => {
    if (initialized.current || computedInitialView === null) return;

    initialized.current = true;

    // Load wallets if they exist
    if (subWallets && subWallets.length > 0) {
      setWallets(subWallets);
    }
  }, [computedInitialView, subWallets, setWallets]);

  // Use computed view if not yet initialized, otherwise use override from store
  const currentView = viewOverride ?? (subWallets === undefined ? 'loading' : computedInitialView ?? 'loading');

  // View transition handler
  const setView = useCallback((newView: AppView) => {
    setViewOverride(newView);
  }, [setViewOverride]);

  // Simple view rendering per Spec Phase 1 flow
  switch (currentView) {
    case 'loading':
      return <LoadingScreen />;
    case 'welcome':
      // Step 0: Logo animation (3-5 seconds)
      return <WelcomeScreen onComplete={() => setView('philosophy')} />;
    case 'philosophy':
      // Step 1 (Spec): Philosophy/Brand message page
      return <PhilosophyScreen onStart={() => setView('setup')} />;
    case 'setup':
      // Step 2-3 (Spec): Password setup + PassKey setup
      return <WalletSetupWizard onComplete={() => setView('dashboard')} />;
    case 'unlock':
      return <UnlockScreen onUnlock={() => setView('dashboard')} />;
    case 'dashboard':
      return (
        <DashboardLayout>
          <ErrorBoundary>
            <PortfolioHome />
          </ErrorBoundary>
        </DashboardLayout>
      );
  }
}
