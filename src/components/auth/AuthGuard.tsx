"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { LoadingScreen } from "@/components/wallet/LoadingScreen";
import db from "@/lib/storage/db";
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
 * 如果未解鎖或沒有錢包，自動導向首頁（首頁會處理解鎖流程）
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isUnlocked = useWalletStore((state) => state.isUnlocked);

  // Check if wallet exists
  const subWallets = useLiveQuery(() => db.sub_wallets.toArray());

  // Compute auth state
  const authState = useMemo(() => {
    // Still loading wallet data
    if (subWallets === undefined) {
      return "loading";
    }

    // No wallet exists - redirect to setup
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

  // Redirect to home if not authenticated
  useEffect(() => {
    if (authState === "no-wallet" || authState === "locked") {
      router.replace("/");
    }
  }, [authState, router]);

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
