import { UnlockContent } from "@/components/unlock/UnlockContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "解鎖錢包 | Keylio",
  description: "使用生物辨識解鎖您的 Keylio 錢包。",
};

/**
 * Unlock 頁面 - Server Component
 *
 * 負責：
 * 1. 提供頁面 metadata
 * 2. 渲染 UnlockContent (Client Component)
 */
export default function UnlockPage() {
  return <UnlockContent />;
}
