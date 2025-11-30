/**
 * Keylio Wallet - Library Exports
 *
 * This module provides a centralized export point for all library utilities.
 * Organized by domain for easy discovery.
 *
 * @module lib
 */

// ========================================
// Animations
// ========================================
export {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  stepTransition,
  slideInRight,
  slideInLeft,
  staggerContainer,
  staggerItem,
  modalBackdrop,
  modalContent,
  buttonTap,
  cardHover,
  rippleEffect,
} from "./animations";

// ========================================
// Blockchain & Chain
// ========================================
export {
  // Chain configuration
  CHAINS,
  ACTIVE_CHAIN,
  ACTIVE_CHAIN_NAME,
  getActiveChainTokens,
  // Backward compatibility
  PLASMA_CHAIN_ID,
  PLASMA_RPC_URL,
  PLASMA_SYMBOL,
  PLASMA_EXPLORER,
  // Provider management
  getProvider,
  getProviderSync,
  getProviderForChain,
  withRetry,
  // Utilities
  formatBalance,
  parseBalance,
  // Types
  type ChainConfig,
  type ChainTokenAddresses,
} from "./chain";

// ========================================
// Cryptography
// ========================================
export {
  // Mnemonic utilities
  generateMnemonic,
  validateMnemonic,
  isValidMnemonic,
  // HD Wallet derivation
  DERIVATION_PATH,
  deriveWallet,
  deriveXpub,
  deriveAddressFromXpub,
  deriveSigningWallet,
  // Encryption/Decryption
  encryptData,
  decryptData,
  encryptPasswordForStorage,
  decryptStoredPassword,
  // Types
  type EncryptedData,
} from "./crypto";

// ========================================
// Errors
// ========================================
export {
  ErrorCode,
  ERROR_MESSAGES,
  KeylioError,
  isKeylioError,
  wrapError,
  getErrorMessage,
  logError,
} from "./errors";

// ========================================
// Formatters
// ========================================
export {
  formatUSD,
  formatCurrency,
  formatPercent,
  formatTokenBalance,
  shortenAddress,
  isValidNumber,
  safeParseNumber,
  formatDateTime,
  formatRelativeTime,
} from "./formatters";

// ========================================
// Passkey
// ========================================
export {
  detectDeviceName,
  generateRegistrationOptions,
  generateAuthenticationOptions,
  registerPasskey,
  authenticatePasskey,
  getDefaultPasskey,
  getAllPasskeys,
} from "./passkey";

// ========================================
// Session Management
// ========================================
export {
  sessionManager,
  hasActiveSession,
  createSession,
  destroySession,
  storeEncryptedPassword,
  getDecryptedPassword,
  hasStoredPassword,
} from "./session";

// ========================================
// Theme
// ========================================
export {
  getThemeFromCookie,
  setThemeCookie,
  getResolvedTheme,
  applyTheme,
  type Theme,
} from "./theme";

// ========================================
// Toast Notifications
// ========================================
export {
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  dismissToast,
  TOAST_MESSAGES,
  toast,
} from "./toast";

// ========================================
// Tokens
// ========================================
export {
  TOKENS,
  ERC20_ABI,
  getTokenByAddress,
  getTokenBySymbol,
  getNativeToken,
  getStablecoins,
  getAllTokens,
  formatTokenAmount,
  parseTokenAmount,
  getTokenValueUSD,
  type TokenConfig,
} from "./tokens";

// ========================================
// Transactions
// ========================================
export {
  estimateGas,
  validateTransaction,
  sendTransaction,
  sendTransactionWithSession,
  watchTransaction,
  getTransactionStatus,
  type TransactionRequest,
  type TransactionResult,
  type GasEstimate,
} from "./transaction";

// ========================================
// Transaction Sync
// ========================================
export {
  syncWalletTransactions,
  syncAllWallets,
  startTransactionSync,
  stopTransactionSync,
  isTransactionSyncRunning,
  getLastSyncTimestamp,
  isSyncInProgress,
  manualSync,
} from "./transaction-sync";

// ========================================
// Portfolio Snapshots
// ========================================
export {
  savePortfolioSnapshot,
  getPortfolioSnapshots,
  generateChartData,
  calculateChange,
  cleanupOldSnapshots,
  type ChartDataPoint,
} from "./portfolio-snapshot";

// ========================================
// Utilities
// ========================================
export { cn } from "./utils";
