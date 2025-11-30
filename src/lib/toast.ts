/**
 * Keylio Wallet - 統一 Toast 通知系統
 *
 * 確保所有通知訊息風格一致：
 * - 成功訊息：動詞 + 結果（無驚嘆號）
 * - 錯誤訊息：描述問題（提供解決方向）
 * - 資訊訊息：中性說明
 */

import { toast as sonnerToast } from "sonner";

// ========================================
// 統一訊息格式
// ========================================

/**
 * 成功通知
 * @example showSuccess("已新增聯絡人")
 * @example showSuccess("交易已發送")
 */
export function showSuccess(message: string, description?: string) {
  sonnerToast.success(message, { description });
}

/**
 * 錯誤通知
 * @example showError("密碼錯誤")
 * @example showError("交易失敗", "請檢查網路連線後重試")
 */
export function showError(message: string, description?: string) {
  sonnerToast.error(message, { description });
}

/**
 * 資訊通知
 * @example showInfo("此聯絡人已存在")
 * @example showInfo("功能即將推出")
 */
export function showInfo(message: string, description?: string) {
  sonnerToast.info(message, { description });
}

/**
 * 警告通知
 * @example showWarning("餘額不足", "請先充值後再試")
 */
export function showWarning(message: string, description?: string) {
  sonnerToast.warning(message, { description });
}

/**
 * 載入通知（可 dismiss）
 * @returns dismiss function
 */
export function showLoading(message: string) {
  return sonnerToast.loading(message);
}

/**
 * 關閉指定通知
 */
export function dismissToast(toastId: string | number) {
  sonnerToast.dismiss(toastId);
}

// ========================================
// 預設訊息常數（確保一致性）
// ========================================

export const TOAST_MESSAGES = {
  // 通用
  COPIED: "已複製到剪貼簿",
  SAVED: "已儲存",
  UPDATED: "已更新",
  DELETED: "已刪除",
  FAILED: "操作失敗",
  RETRY: "請重試",

  // 驗證
  AUTH_SUCCESS: "驗證成功",
  AUTH_FAILED: "驗證失敗",
  PASSWORD_WRONG: "密碼錯誤",
  SESSION_EXPIRED: "Session 已過期，請重新登入",

  // 錢包
  WALLET_CREATED: "錢包已建立",
  WALLET_UNLOCKED: "歡迎回來",
  WALLET_SWITCHED: (name: string) => `已切換至 ${name}`,

  // 交易
  TX_SENT: "交易已發送",
  TX_SUCCESS: "交易成功",
  TX_FAILED: "交易失敗",
  INSUFFICIENT_BALANCE: "餘額不足",

  // 聯絡人
  CONTACT_ADDED: "已新增聯絡人",
  CONTACT_UPDATED: "聯絡人已更新",
  CONTACT_DELETED: "聯絡人已刪除",
  CONTACT_EXISTS: "此聯絡人已存在",

  // 設定
  SETTINGS_UPDATED: "設定已更新",

  // 備份
  BACKUP_SUCCESS: "備份驗證成功",
  BACKUP_FAILED: "備份驗證失敗",
} as const;

// ========================================
// 向後兼容 - 直接導出 sonner toast
// ========================================
export { sonnerToast as toast };
