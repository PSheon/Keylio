/**
 * UI Design Tokens
 *
 * 統一的設計系統 tokens，供所有 UI 元件共用
 * 確保 Dialog、Drawer、AlertDialog 等元件的視覺一致性
 */

// ============================================================================
// Overlay Tokens - 遮罩層樣式
// ============================================================================
export const OVERLAY_TOKENS = {
  /** 標準遮罩背景 */
  base: "bg-black/60 backdrop-blur-sm",
  /** 較淺的遮罩背景 */
  light: "bg-black/40 backdrop-blur-sm",
  /** 較深的遮罩背景 */
  dark: "bg-black/80 backdrop-blur-sm",
} as const;

// ============================================================================
// Surface Tokens - 表面/容器樣式
// ============================================================================
export const SURFACE_TOKENS = {
  /** 主要背景色 */
  primary: "bg-keylio-bg-primary",
  /** 次要背景色 (常用於卡片、對話框) */
  secondary: "bg-keylio-bg-secondary",
  /** 第三層背景色 (常用於輸入框、hover 狀態) */
  tertiary: "bg-keylio-bg-tertiary",
  /** 邊框色 */
  border: "border-keylio-border",
  /** 主要邊框色 */
  borderPrimary: "border-keylio-border-primary",
} as const;

// ============================================================================
// Text Tokens - 文字樣式
// ============================================================================
export const TEXT_TOKENS = {
  /** 主要文字色 */
  primary: "text-keylio-text-primary",
  /** 次要文字色 */
  secondary: "text-keylio-text-secondary",
  /** 淡化文字色 */
  muted: "text-keylio-text-muted",
  /** 品牌色文字 */
  brand: "text-keylio-teal",
} as const;

// ============================================================================
// Interactive Tokens - 互動元素樣式
// ============================================================================
export const INTERACTIVE_TOKENS = {
  /** 關閉按鈕背景 */
  closeBg: "bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80",
  /** 關閉按鈕文字 */
  closeText: "text-keylio-text-secondary hover:text-keylio-text-primary",
  /** Focus ring */
  focusRing: "focus-visible:ring-2 focus-visible:ring-keylio-teal/50",
} as const;

// ============================================================================
// Animation Tokens - 動畫相關
// ============================================================================
export const ANIMATION_TOKENS = {
  /** 標準過渡時間 */
  transition: "transition-all duration-200",
  /** 快速過渡 */
  transitionFast: "transition-all duration-150",
  /** 慢速過渡 */
  transitionSlow: "transition-all duration-300",
} as const;

// ============================================================================
// Composite Tokens - 組合 tokens (向後兼容)
// ============================================================================

/** Dialog 專用 tokens (向後兼容) */
export const DIALOG_TOKENS = {
  overlay: {
    base: OVERLAY_TOKENS.base,
  },
  content: {
    bg: SURFACE_TOKENS.secondary,
    border: SURFACE_TOKENS.border,
    text: TEXT_TOKENS.primary,
  },
  close: {
    bg: INTERACTIVE_TOKENS.closeBg,
    text: INTERACTIVE_TOKENS.closeText,
  },
} as const;

/** Drawer 專用 tokens (向後兼容) */
export const DRAWER_TOKENS = {
  overlay: {
    base: OVERLAY_TOKENS.base,
  },
  content: {
    bg: SURFACE_TOKENS.secondary,
    border: SURFACE_TOKENS.border,
    text: TEXT_TOKENS.primary,
  },
  handle: {
    bg: SURFACE_TOKENS.borderPrimary,
  },
} as const;

// ============================================================================
// Size Tokens - 尺寸相關
// ============================================================================
export const SIZE_TOKENS = {
  /** Icon sizes */
  icon: {
    xs: "size-3",
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
    xl: "size-8",
  },
  /** Spacing */
  spacing: {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
    xl: "gap-6",
  },
  /** Padding */
  padding: {
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-5",
    xl: "p-6",
  },
} as const;

// ============================================================================
// Border Radius Tokens
// ============================================================================
export const RADIUS_TOKENS = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;
