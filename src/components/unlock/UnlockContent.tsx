"use client";

import { useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouterContext } from "@/components/providers/RouterProvider";
import { LoadingScreen } from "@/components/wallet/LoadingScreen";
import { UnlockScreen } from "@/components/wallet/UnlockScreen";
import db from "@/lib/storage/db";
import { useRedirectStore } from "@/stores/useRedirectStore";
import { useWalletStore } from "@/stores/useWalletStore";

/**
 * Unlock 內容元件 - Client Component
 *
 * 負責：
 * 1. 檢查是否有錢包（無錢包則導向 onboarding）
 * 2. 檢查是否已解鎖（已解鎖則導向首頁）
 * 3. 處理解鎖成功後的重導向
 */
export function UnlockContent() {
  const { navigateTo } = useRouterContext();
  const isUnlocked = useWalletStore((state) => state.isUnlocked);
  const setWallets = useWalletStore((state) => state.setWallets);
  const consumeRedirectUrl = useRedirectStore((state) => state.consumeRedirectUrl);

  // 檢查是否已有錢包
  const subWallets = useLiveQuery(() => db.sub_wallets.toArray());

  // 初始化：檢查錢包狀態
  useEffect(() => {
    if (subWallets === undefined) return; // 還在載入

    if (subWallets.length === 0) {
      // 沒有錢包，導向 onboarding
      navigateTo("/onboarding", { replace: true });
      return;
    }

    // 載入錢包到 store
    setWallets(subWallets);

    if (isUnlocked) {
      // 已解鎖，導向首頁
      navigateTo("/", { replace: true });
    }
  }, [subWallets, isUnlocked, navigateTo, setWallets]);

  // 解鎖成功處理
  const handleUnlock = useCallback(() => {
    const redirectUrl = consumeRedirectUrl();
    if (redirectUrl && redirectUrl !== "/" && redirectUrl !== "/unlock") {
      // 導向原本請求的頁面
      navigateTo(redirectUrl, { replace: true });
    } else {
      // 預設導向首頁
      navigateTo("/", { replace: true });
    }
  }, [consumeRedirectUrl, navigateTo]);

  // 載入中或檢查狀態中
  if (subWallets === undefined) {
    return <LoadingScreen />;
  }

  // 沒有錢包或已解鎖，等待重導向
  if (subWallets.length === 0 || isUnlocked) {
    return <LoadingScreen />;
  }

  // 顯示解鎖畫面
  return <UnlockScreen onUnlock={handleUnlock} />;
}
