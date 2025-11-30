"use client";

import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouterContext } from "@/components/providers/RouterProvider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { LoadingScreen } from "@/components/wallet/LoadingScreen";
import { PortfolioHome } from "@/components/wallet/PortfolioHome";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import db from "@/lib/storage/db";
import { useWalletStore } from "@/stores/useWalletStore";

/**
 * 首頁內容元件 - Client Component
 *
 * 負責：
 * 1. 根據錢包狀態進行路由分發
 *    - 無錢包 → /onboarding
 *    - 有錢包但未解鎖 → /unlock
 *    - 已解鎖 → Dashboard
 * 2. 渲染 Dashboard 內容
 */
export function HomeContent() {
  const { navigateTo } = useRouterContext();
  const initialized = useRef(false);

  const setWallets = useWalletStore((state) => state.setWallets);
  const isUnlocked = useWalletStore((state) => state.isUnlocked);

  // 檢查是否有錢包
  const subWallets = useLiveQuery(() => db.sub_wallets.toArray());

  // 防止意外重整頁面（已解鎖時）
  useBeforeUnload({ enabled: isUnlocked });

  // 路由分發邏輯
  useEffect(() => {
    if (subWallets === undefined) return; // 還在載入

    // 沒有錢包 → onboarding
    if (subWallets.length === 0) {
      navigateTo("/onboarding", { replace: true });
      return;
    }

    // 載入錢包到 store（只執行一次）
    if (!initialized.current) {
      initialized.current = true;
      setWallets(subWallets);
    }

    // 有錢包但未解鎖 → unlock
    if (!isUnlocked) {
      navigateTo("/unlock", { replace: true });
      return;
    }
  }, [subWallets, isUnlocked, navigateTo, setWallets]);

  // 載入中
  if (subWallets === undefined) {
    return <LoadingScreen />;
  }

  // 等待重導向
  if (subWallets.length === 0 || !isUnlocked) {
    return <LoadingScreen />;
  }

  // 已解鎖：顯示 Dashboard
  return (
    <DashboardLayout>
      <ErrorBoundary>
        <PortfolioHome />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
