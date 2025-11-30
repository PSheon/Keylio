/**
 * useBeforeUnload Hook
 *
 * 在用戶嘗試重整、關閉分頁或導航離開時顯示確認對話框
 * 用於保護未保存的資料或防止意外中斷 session
 */

import { useEffect } from "react";

interface UseBeforeUnloadOptions {
  /** 是否啟用確認對話框 */
  enabled?: boolean;
  /** 確認訊息（注意：現代瀏覽器會忽略自訂訊息，顯示預設訊息） */
  message?: string;
}

/**
 * 防止用戶意外重整或關閉頁面
 *
 * @example
 * ```tsx
 * // 始終啟用
 * useBeforeUnload();
 *
 * // 條件啟用（例如：有未保存的變更時）
 * useBeforeUnload({ enabled: hasUnsavedChanges });
 *
 * // 自訂訊息（僅用於舊瀏覽器）
 * useBeforeUnload({ message: "您有未保存的變更，確定要離開嗎？" });
 * ```
 */
export function useBeforeUnload(options: UseBeforeUnloadOptions = {}) {
  const { enabled = true, message = "您確定要離開嗎？重新載入頁面將需要重新解鎖錢包。" } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // 標準方式觸發確認對話框
      event.preventDefault();
      // 設定 returnValue 以兼容舊瀏覽器
      // 注意：現代瀏覽器會顯示預設訊息，忽略自訂訊息
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, message]);
}
