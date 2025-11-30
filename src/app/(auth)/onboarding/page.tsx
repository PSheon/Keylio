import { OnboardingContent } from "@/components/onboarding/OnboardingContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "開始使用 | Keylio",
  description: "建立您的第一個 Keylio 錢包，安全、簡單、快速。",
};

/**
 * Onboarding 頁面 - Server Component
 *
 * 負責：
 * 1. 提供頁面 metadata
 * 2. 渲染 OnboardingContent (Client Component)
 *
 * 流程：Philosophy → Setup Wizard → 完成後導向 Dashboard
 */
export default function OnboardingPage() {
  return <OnboardingContent />;
}
