/**
 * Keylio Wallet - Error Handling System
 * Centralized error types and handling utilities
 */

// ========================================
// Error Types
// ========================================

export enum ErrorCode {
  // Authentication Errors (1000-1999)
  AUTH_PASSWORD_WRONG = 1001,
  AUTH_PASSKEY_FAILED = 1002,
  AUTH_SESSION_EXPIRED = 1003,
  AUTH_INVALID_MNEMONIC = 1004,

  // Wallet Errors (2000-2999)
  WALLET_NOT_FOUND = 2001,
  WALLET_CREATION_FAILED = 2002,
  WALLET_DERIVATION_FAILED = 2003,
  WALLET_ENCRYPTION_FAILED = 2004,
  WALLET_DECRYPTION_FAILED = 2005,

  // Transaction Errors (3000-3999)
  TX_INSUFFICIENT_BALANCE = 3001,
  TX_INVALID_ADDRESS = 3002,
  TX_SIGNING_FAILED = 3003,
  TX_BROADCAST_FAILED = 3004,
  TX_GAS_ESTIMATION_FAILED = 3005,
  TX_REJECTED = 3006,

  // Network Errors (4000-4999)
  NETWORK_CONNECTION_FAILED = 4001,
  NETWORK_RPC_ERROR = 4002,
  NETWORK_TIMEOUT = 4003,
  NETWORK_CHAIN_MISMATCH = 4004,

  // Storage Errors (5000-5999)
  STORAGE_READ_FAILED = 5001,
  STORAGE_WRITE_FAILED = 5002,
  STORAGE_NOT_FOUND = 5003,

  // Unknown
  UNKNOWN = 9999,
}

// User-friendly error messages in Traditional Chinese
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_PASSWORD_WRONG]: '密碼錯誤，請重新輸入',
  [ErrorCode.AUTH_PASSKEY_FAILED]: 'Passkey 驗證失敗，請重試',
  [ErrorCode.AUTH_SESSION_EXPIRED]: '登入已過期，請重新解鎖錢包',
  [ErrorCode.AUTH_INVALID_MNEMONIC]: '助記詞格式錯誤，請確認是 12 個英文單字',

  [ErrorCode.WALLET_NOT_FOUND]: '找不到錢包資料',
  [ErrorCode.WALLET_CREATION_FAILED]: '錢包創建失敗，請稍後再試',
  [ErrorCode.WALLET_DERIVATION_FAILED]: '錢包派生失敗',
  [ErrorCode.WALLET_ENCRYPTION_FAILED]: '加密失敗，請稍後再試',
  [ErrorCode.WALLET_DECRYPTION_FAILED]: '解密失敗，密碼可能錯誤',

  [ErrorCode.TX_INSUFFICIENT_BALANCE]: '餘額不足',
  [ErrorCode.TX_INVALID_ADDRESS]: '無效的錢包地址',
  [ErrorCode.TX_SIGNING_FAILED]: '交易簽署失敗',
  [ErrorCode.TX_BROADCAST_FAILED]: '交易廣播失敗，請稍後再試',
  [ErrorCode.TX_GAS_ESTIMATION_FAILED]: '無法估算 Gas 費用',
  [ErrorCode.TX_REJECTED]: '交易被拒絕',

  [ErrorCode.NETWORK_CONNECTION_FAILED]: '網路連線失敗，請檢查網路狀態',
  [ErrorCode.NETWORK_RPC_ERROR]: 'RPC 節點錯誤，請稍後再試',
  [ErrorCode.NETWORK_TIMEOUT]: '連線逾時，請稍後再試',
  [ErrorCode.NETWORK_CHAIN_MISMATCH]: '網路不匹配',

  [ErrorCode.STORAGE_READ_FAILED]: '讀取資料失敗',
  [ErrorCode.STORAGE_WRITE_FAILED]: '儲存資料失敗',
  [ErrorCode.STORAGE_NOT_FOUND]: '找不到資料',

  [ErrorCode.UNKNOWN]: '發生未知錯誤，請稍後再試',
};

// ========================================
// Custom Error Class
// ========================================

export class KeylioError extends Error {
  readonly code: ErrorCode;
  readonly context?: Record<string, unknown>;
  readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    const message = ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN];
    super(message);

    this.name = 'KeylioError';
    this.code = code;
    this.context = context;
    this.originalError = originalError;

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KeylioError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

// ========================================
// Error Utilities
// ========================================

/**
 * Type guard to check if an error is a KeylioError
 */
export function isKeylioError(error: unknown): error is KeylioError {
  return error instanceof KeylioError;
}

/**
 * Wrap any error into a KeylioError with appropriate code
 */
export function wrapError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.UNKNOWN,
  context?: Record<string, unknown>
): KeylioError {
  if (isKeylioError(error)) {
    return error;
  }

  const originalError = error instanceof Error ? error : new Error(String(error));

  // Try to infer error code from error message
  const inferredCode = inferErrorCode(originalError);

  return new KeylioError(
    inferredCode || defaultCode,
    context,
    originalError
  );
}

/**
 * Attempt to infer error code from error message
 */
function inferErrorCode(error: Error): ErrorCode | null {
  const message = error.message.toLowerCase();

  if (message.includes('insufficient') || message.includes('balance')) {
    return ErrorCode.TX_INSUFFICIENT_BALANCE;
  }
  if (message.includes('invalid address')) {
    return ErrorCode.TX_INVALID_ADDRESS;
  }
  if (message.includes('network') || message.includes('fetch')) {
    return ErrorCode.NETWORK_CONNECTION_FAILED;
  }
  if (message.includes('timeout')) {
    return ErrorCode.NETWORK_TIMEOUT;
  }
  if (message.includes('decrypt') || message.includes('wrong password')) {
    return ErrorCode.WALLET_DECRYPTION_FAILED;
  }

  return null;
}

/**
 * Get user-friendly message for any error
 */
export function getErrorMessage(error: unknown): string {
  if (isKeylioError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    const wrapped = wrapError(error);
    return wrapped.message;
  }

  return ERROR_MESSAGES[ErrorCode.UNKNOWN];
}

/**
 * Log error for debugging (without sensitive data)
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const keylioError = isKeylioError(error) ? error : wrapError(error);

  // Filter out sensitive keys from context
  const sanitizedContext = context ? sanitizeContext(context) : undefined;

  console.error('[Keylio Error]', {
    code: keylioError.code,
    message: keylioError.message,
    context: sanitizedContext,
    // Only include stack in development
    ...(process.env.NODE_ENV === 'development' && {
      stack: keylioError.stack,
      originalError: keylioError.originalError?.message,
    }),
  });
}

/**
 * Remove sensitive data from context before logging
 */
function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'mnemonic', 'privateKey', 'seed', 'secret'];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
