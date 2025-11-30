/**
 * 統一格式化工具函數
 * 
 * 此模組提供標準化的數字、金額、百分比和地址格式化功能，
 * 確保整個應用程式中顯示格式的一致性。
 */

/**
 * 格式化 USD 金額（簡化版）
 * @param amount 金額數值
 * @returns 格式化後的字串，如 "$1,234.56"
 */
export function formatUSD(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "$0.00";
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * 格式化金額為 USD 貨幣格式
 * @param amount 金額數值
 * @param options 可選配置
 * @returns 格式化後的字串，如 "$1,234.56"
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: {
    currency?: string;
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSign?: boolean;
  } = {}
): string {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSign = false,
  } = options;

  // 處理無效值
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "$0.00";
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return formatted;
}

/**
 * 格式化百分比
 * @param value 百分比數值 (例如 5.5 表示 5.5%)
 * @param options 可選配置
 * @returns 格式化後的字串，如 "+5.50%" 或 "-3.20%"
 */
export function formatPercent(
  value: number | null | undefined,
  options: {
    decimals?: number;
    showSign?: boolean;
    fallback?: string;
  } = {}
): string {
  const { decimals = 2, showSign = true, fallback = "0.00%" } = options;

  // 處理無效值
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  const formatted = `${Math.abs(value).toFixed(decimals)}%`;

  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return formatted;
}

/**
 * 格式化代幣數量
 * @param amount 代幣數量
 * @param options 可選配置
 * @returns 格式化後的字串，如 "1,234.5678"
 */
export function formatTokenBalance(
  amount: number | string | null | undefined,
  options: {
    decimals?: number;
    compact?: boolean;
  } = {}
): string {
  const { decimals = 4, compact = false } = options;

  // 處理無效值
  if (amount === null || amount === undefined) {
    return "0";
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (!Number.isFinite(numAmount)) {
    return "0";
  }

  // 大數字使用緊湊格式 (K, M, B)
  if (compact && Math.abs(numAmount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(numAmount);
  }

  // 小數字顯示更多精度
  if (Math.abs(numAmount) < 0.01 && numAmount !== 0) {
    return numAmount.toFixed(6);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(numAmount);
}

/**
 * 縮短錢包地址
 * @param address 完整地址
 * @param options 可選配置
 * @returns 縮短後的地址，如 "0x1234...5678"
 */
export function shortenAddress(
  address: string | null | undefined,
  options: {
    startChars?: number;
    endChars?: number;
  } = {}
): string {
  const { startChars = 6, endChars = 4 } = options;

  if (!address) {
    return "";
  }

  if (address.length <= startChars + endChars + 3) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * 檢查數值是否有效（非 NaN、非 Infinity、非 null/undefined）
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * 安全地解析數字，無效值返回預設值
 */
export function safeParseNumber(
  value: unknown,
  fallback: number = 0
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

/**
 * 格式化時間戳為本地日期時間
 */
export function formatDateTime(
  timestamp: number | Date | null | undefined,
  options: {
    locale?: string;
    includeTime?: boolean;
  } = {}
): string {
  const { locale = "zh-TW", includeTime = true } = options;

  if (!timestamp) {
    return "-";
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "-";
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  if (includeTime) {
    dateOptions.hour = "2-digit";
    dateOptions.minute = "2-digit";
  }

  return new Intl.DateTimeFormat(locale, dateOptions).format(date);
}

/**
 * 格式化相對時間（多久前）
 */
export function formatRelativeTime(
  timestamp: number | Date | null | undefined
): string {
  if (!timestamp) {
    return "-";
  }

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  if (isNaN(date.getTime())) {
    return "-";
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "剛剛";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分鐘前`;
  }

  if (diffHours < 24) {
    return `${diffHours} 小時前`;
  }

  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return formatDateTime(date, { includeTime: false });
}
