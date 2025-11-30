/**
 * Browser Environment Detection Utilities
 *
 * 偵測 in-app 瀏覽器（如 LINE、Facebook、Instagram 等）
 * 這些瀏覽器通常不支援 WebAuthn/Passkey，需要引導用戶使用外部瀏覽器
 */

export interface BrowserInfo {
  /** 是否為 in-app 瀏覽器 */
  isInAppBrowser: boolean;
  /** 瀏覽器名稱 */
  browserName: string;
  /** 建議的外部瀏覽器名稱 */
  suggestedBrowser: string;
  /** 是否支援 WebAuthn */
  supportsWebAuthn: boolean;
  /** 是否為 iOS */
  isIOS: boolean;
  /** 是否為 Android */
  isAndroid: boolean;
}

/**
 * In-app 瀏覽器 User Agent 特徵
 * 這些特徵用於識別常見的 in-app 瀏覽器
 */
const IN_APP_BROWSER_PATTERNS = [
  // LINE
  { pattern: /Line/i, name: "LINE" },
  // Facebook
  { pattern: /FBAN|FBAV|FB_IAB/i, name: "Facebook" },
  // Instagram
  { pattern: /Instagram/i, name: "Instagram" },
  // WeChat
  { pattern: /MicroMessenger/i, name: "WeChat" },
  // Twitter/X
  { pattern: /Twitter/i, name: "Twitter" },
  // Telegram
  { pattern: /TelegramBot/i, name: "Telegram" },
  // Snapchat
  { pattern: /Snapchat/i, name: "Snapchat" },
  // TikTok
  { pattern: /BytedanceWebview|TikTok/i, name: "TikTok" },
  // LinkedIn
  { pattern: /LinkedInApp/i, name: "LinkedIn" },
  // Pinterest
  { pattern: /Pinterest/i, name: "Pinterest" },
  // Discord
  { pattern: /Discord/i, name: "Discord" },
  // Slack
  { pattern: /Slack/i, name: "Slack" },
  // Generic WebView detection
  { pattern: /\bwv\b|WebView/i, name: "WebView" },
];

/**
 * 檢測當前瀏覽器環境
 */
export function detectBrowserEnvironment(): BrowserInfo {
  // SSR check
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isInAppBrowser: false,
      browserName: "Unknown",
      suggestedBrowser: "Safari",
      supportsWebAuthn: false,
      isIOS: false,
      isAndroid: false,
    };
  }

  const ua = navigator.userAgent;

  // Detect OS
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);

  // Detect in-app browser
  let isInAppBrowser = false;
  let browserName = "Browser";

  for (const { pattern, name } of IN_APP_BROWSER_PATTERNS) {
    if (pattern.test(ua)) {
      isInAppBrowser = true;
      browserName = name;
      break;
    }
  }

  // Additional iOS detection: standalone mode check
  // If it's iOS but not Safari and not a known browser, it might be in-app
  if (isIOS && !isInAppBrowser) {
    // Check if running in standalone mode (PWA)
    const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!isStandalone) {
      // Check for Safari
      const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
      if (!isSafari) {
        // Likely an in-app browser we didn't catch
        isInAppBrowser = true;
        browserName = "App Browser";
      }
    }
  }

  // Determine suggested browser
  const suggestedBrowser = isIOS ? "Safari" : isAndroid ? "Chrome" : "Chrome";

  // Check WebAuthn support
  const supportsWebAuthn = typeof window.PublicKeyCredential !== "undefined";

  return {
    isInAppBrowser,
    browserName,
    suggestedBrowser,
    supportsWebAuthn,
    isIOS,
    isAndroid,
  };
}

/**
 * 嘗試在外部瀏覽器中打開 URL
 *
 * 不同的 in-app 瀏覽器有不同的方式打開外部瀏覽器：
 * - LINE: 使用 line://... URL scheme
 * - Facebook/Instagram: 通常需要手動複製連結
 * - 其他: 嘗試使用 intent:// (Android) 或直接跳轉
 */
export function openInExternalBrowser(url: string, browserInfo: BrowserInfo): boolean {
  const { isIOS, isAndroid, browserName } = browserInfo;

  // Ensure absolute URL
  const absoluteUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

  // LINE specific handling
  if (browserName === "LINE") {
    // LINE supports opening URLs in external browser
    // LINE's external browser can be triggered by adding ?openExternalBrowser=1
    const externalUrl = `${absoluteUrl}${absoluteUrl.includes("?") ? "&" : "?"}openExternalBrowser=1`;
    window.location.href = externalUrl;
    return true;
  }

  // Facebook / Instagram
  if (browserName === "Facebook" || browserName === "Instagram") {
    // These don't have a reliable way to open external browser
    // Best approach is to show instructions to the user
    return false;
  }

  // Android: Try intent URL
  if (isAndroid) {
    try {
      // Try Chrome intent
      const intentUrl = `intent://${absoluteUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
      return true;
    } catch {
      // Fallback: try to open directly
      window.open(absoluteUrl, "_system");
      return true;
    }
  }

  // iOS: Try to open in Safari
  if (isIOS) {
    // iOS doesn't have a reliable way to force Safari from in-app browsers
    // We can try x-safari-https:// but it's not widely supported
    // Best approach is to show instructions
    return false;
  }

  // Desktop or unknown: try window.open
  window.open(absoluteUrl, "_blank");
  return true;
}

/**
 * 複製文字到剪貼簿
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const result = document.execCommand("copy");
    document.body.removeChild(textArea);
    return result;
  } catch {
    return false;
  }
}

/**
 * 取得當前頁面完整 URL
 */
export function getCurrentUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}
