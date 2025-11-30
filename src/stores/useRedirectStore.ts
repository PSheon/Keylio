/**
 * Redirect Store
 *
 * 管理驗證後的重導向 URL
 * 當用戶被導向 unlock 頁面時，記錄原始 URL，驗證成功後自動返回
 */

import { create } from "zustand";

interface RedirectState {
  /** 驗證後要重導向的 URL */
  redirectUrl: string | null;

  /** 設定重導向 URL */
  setRedirectUrl: (url: string | null) => void;

  /** 清除重導向 URL 並返回其值 */
  consumeRedirectUrl: () => string | null;
}

export const useRedirectStore = create<RedirectState>((set, get) => ({
  redirectUrl: null,

  setRedirectUrl: (url) => set({ redirectUrl: url }),

  consumeRedirectUrl: () => {
    const url = get().redirectUrl;
    set({ redirectUrl: null });
    return url;
  },
}));

/**
 * 取得當前的重導向 URL（不消費）
 */
export const selectRedirectUrl = (state: RedirectState) => state.redirectUrl;
