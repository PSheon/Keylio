"use client";

import { useCallback, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouterContext } from "@/components/providers/RouterProvider";
import { LoadingScreen } from "@/components/wallet/LoadingScreen";
import { PhilosophyScreen } from "@/components/wallet/PhilosophyScreen";
import { WalletSetupWizard } from "@/components/wallet/WalletSetupWizard";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import db from "@/lib/storage/db";
import { useWalletStore } from "@/stores/useWalletStore";

/**
 * Onboarding 內容元件 - Client Component
 *
 * 負責：
 * 1. 整合 Philosophy + Setup Wizard 流程
 * 2. 檢查是否已有錢包（如有則重導向到首頁）
 * 3. 完成後導向到 Dashboard
 *
 * 流程：Philosophy → Setup Wizard → Dashboard
 */
export function OnboardingContent() {
  const { navigateTo } = useRouterContext();
  const onboardingStep = useWalletStore((state) => state.onboardingStep);
  const setOnboardingStep = useWalletStore((state) => state.setOnboardingStep);

  // 檢查是否已有錢包
  const subWallets = useLiveQuery(() => db.sub_wallets.toArray());

  // 防止意外重整頁面（setup 階段）
  useBeforeUnload({ enabled: onboardingStep === "setup" });

  // 計算當前步驟（避免在 effect 中 setState）
  const currentStep = useMemo(() => {
    if (subWallets === undefined) return "loading";
    if (subWallets.length > 0) return "redirect";
    return onboardingStep;
  }, [subWallets, onboardingStep]);

  // 完成 onboarding 後導向 dashboard
  const handleComplete = useCallback(() => {
    navigateTo("/", { replace: true });
  }, [navigateTo]);

  // 進入 setup 步驟
  const handleStartSetup = useCallback(() => {
    setOnboardingStep("setup");
  }, [setOnboardingStep]);

  // 已有錢包，重導向
  if (currentStep === "redirect") {
    navigateTo("/", { replace: true });
    return <LoadingScreen />;
  }

  // 渲染對應步驟
  switch (currentStep) {
    case "loading":
      return <LoadingScreen />;

    case "philosophy":
      return <PhilosophyScreen onStart={handleStartSetup} />;

    case "setup":
      return <WalletSetupWizard onComplete={handleComplete} />;
  }
}
