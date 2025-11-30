"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouterContext } from "@/components/providers/RouterProvider";
import { LoadingScreen } from "@/components/wallet/LoadingScreen";
import db from "@/lib/storage/db";
import { useRedirectStore } from "@/stores/useRedirectStore";
import { useWalletStore } from "@/stores/useWalletStore";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 認證守衛元件
 *
 * 保護需要登入的頁面：
 * 1. 檢查是否有錢包
 * 2. 檢查是否已解鎖
 *
 * 路由分發：
 * - 無錢包 → /onboarding
 * - 有錢包但未解鎖 → /unlock
 * - 已解鎖 → 顯示請求的頁面
 *
 * 同時記錄原始 URL，驗證成功後自動返回
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { navigateTo } = useRouterContext();
  const pathname = usePathname();
  const isUnlocked = useWalletStore((state) => state.isUnlocked);
  const setRedirectUrl = useRedirectStore((state) => state.setRedirectUrl);

  // Check if wallet exists
  const subWallets = useLiveQuery(() => db.sub_wallets.toArray());

  // Compute auth state
  const authState = useMemo(() => {
    // Still loading wallet data
    if (subWallets === undefined) {
      return "loading";
    }

    // No wallet exists - redirect to onboarding
    if (subWallets.length === 0) {
      return "no-wallet";
    }

    // Wallet exists but not unlocked
    if (!isUnlocked) {
      return "locked";
    }

    // All good
    return "authenticated";
  }, [subWallets, isUnlocked]);

  // Redirect based on auth state
  useEffect(() => {
    if (authState === "no-wallet") {
      // 無錢包 → onboarding
      navigateTo("/onboarding", { replace: true });
    } else if (authState === "locked") {
      // 記錄當前頁面 URL，驗證成功後返回
      if (pathname && pathname !== "/" && pathname !== "/unlock") {
        setRedirectUrl(pathname);
      }
      // 有錢包但未解鎖 → unlock
      navigateTo("/unlock", { replace: true });
    }
  }, [authState, navigateTo, pathname, setRedirectUrl]);

  // Show loading while checking auth
  if (authState === "loading") {
    return <LoadingScreen />;
  }

  // Redirect in progress
  if (authState === "no-wallet" || authState === "locked") {
    return <LoadingScreen />;
  }

  // Authenticated - render children
  return <>{children}</>;
}
