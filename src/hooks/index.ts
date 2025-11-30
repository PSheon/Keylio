/**
 * Keylio Wallet - Custom Hooks
 *
 * This module exports all custom hooks used across the application.
 * All hooks are client-side only and follow React 19 best practices.
 *
 * @module hooks
 */

// ========================================
// Wallet Hooks
// ========================================
export { useActiveWallet } from "./useWalletSelectors";

// ========================================
// Passkey Hooks
// ========================================
export { usePasskeyEditor } from "./usePasskeyEditor";
export { usePasskeyManager } from "./usePasskeyManager";

// ========================================
// Blockchain & Token Hooks
// ========================================
export {
  useTokenBalance,
  useMultiTokenBalance,
  usePortfolioValue,
} from "./useTokenBalance";

// ========================================
// Portfolio Hooks
// ========================================
export { usePortfolioHistory } from "./usePortfolioHistory";

// ========================================
// Transaction Hooks
// ========================================
export { useTransactionSync } from "./useTransactionSync";

// ========================================
// Session & Activity Hooks
// ========================================
export { useActivityTracker } from "./useActivityTracker";

// ========================================
// Utility Hooks
// ========================================
export { useMediaQuery } from "./useMediaQuery";
