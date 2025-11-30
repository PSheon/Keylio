"use client";

import {
  createContext,
  useContext,
  useCallback,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { GlobalLoadingOverlay } from "@/components/ui/global-loading";

interface RouterContextValue {
  /** 是否正在導航中 */
  isPending: boolean;
  /** 統一的導航方法 */
  navigateTo: (href: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

interface RouterProviderProps {
  children: ReactNode;
}

/**
 * 全局路由 Provider
 *
 * 提供統一的導航方法和載入狀態：
 * 1. 使用 useTransition 實現非阻塞導航
 * 2. 在導航期間顯示全局載入遮罩
 * 3. 確保新頁面完全載入後才隱藏遮罩
 *
 * @example
 * ```tsx
 * const { navigateTo, isPending } = useRouterContext();
 * navigateTo("/settings"); // 會觸發全局載入遮罩
 * ```
 */
export function RouterProvider({ children }: RouterProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigateTo = useCallback(
    (href: string, options?: { replace?: boolean }) => {
      startTransition(() => {
        if (options?.replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
      });
    },
    [router]
  );

  return (
    <RouterContext.Provider value={{ isPending, navigateTo }}>
      {children}
      {/* 全局載入遮罩 */}
      <AnimatePresence>{isPending ? <GlobalLoadingOverlay /> : null}</AnimatePresence>
    </RouterContext.Provider>
  );
}

/**
 * 取得路由 Context
 * @throws 如果不在 RouterProvider 內使用會拋出錯誤
 */
export function useRouterContext() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouterContext must be used within RouterProvider");
  }
  return context;
}

/**
 * 安全版本的 useRouterContext
 * 如果不在 Provider 內，返回 fallback 值
 */
export function useRouterContextSafe() {
  const context = useContext(RouterContext);
  return (
    context ?? {
      isPending: false,
      navigateTo: () => {
        console.warn("RouterProvider not found, navigation disabled");
      },
    }
  );
}
