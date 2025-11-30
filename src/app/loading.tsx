import { LoadingScreen } from "@/components/wallet/LoadingScreen";

/**
 * 全局 Loading 頁面
 *
 * 當頁面載入時顯示（Next.js Suspense fallback）
 */
export default function Loading() {
  return <LoadingScreen />;
}
