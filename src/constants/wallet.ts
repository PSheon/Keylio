/**
 * Wallet Constants
 * 錢包相關共用常數
 */

// ============================================================================
// Emoji Options
// ============================================================================

/** 錢包圖示選項 */
export const WALLET_EMOJI_OPTIONS = [
  "💼", // 公事包 - 主錢包
  "💰", // 錢袋
  "🏦", // 銀行
  "🏠", // 房屋
  "🚗", // 汽車
  "✈️", // 飛機
  "🎮", // 遊戲
  "🛒", // 購物車
  "🎯", // 目標
  "💎", // 鑽石
] as const;

/** 預設錢包圖示 */
export const DEFAULT_WALLET_EMOJI = WALLET_EMOJI_OPTIONS[0];

// ============================================================================
// Color Options
// ============================================================================

/** 錢包顏色選項 */
export const WALLET_COLOR_OPTIONS = [
  "#14b8a6", // Teal (Primary)
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#f43f5e", // Rose
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#06b6d4", // Cyan
] as const;

/** 預設錢包顏色 */
export const DEFAULT_WALLET_COLOR = WALLET_COLOR_OPTIONS[0];

// ============================================================================
// Types
// ============================================================================

export type WalletEmoji = (typeof WALLET_EMOJI_OPTIONS)[number];
export type WalletColor = (typeof WALLET_COLOR_OPTIONS)[number];
