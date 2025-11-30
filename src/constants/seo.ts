/**
 * SEO Constants
 * 統一管理 SEO 相關配置
 */

// ============================================================================
// Site Info
// ============================================================================

/** 網站基本資訊 */
export const SITE_CONFIG = {
  name: "Keylio",
  tagline: "你的錢包，由你掌控",
  description: "安全、去中心化的 HD 錢包，支援 Plasma Chain。端對端加密、Passkey 生物辨識登入，完全掌控你的數位資產。",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://keylio.app",
  locale: "zh-TW",
  language: "zh-Hant",
} as const;

/** 品牌關鍵字 */
export const SITE_KEYWORDS = [
  "Keylio",
  "加密錢包",
  "HD Wallet",
  "Plasma Chain",
  "去中心化錢包",
  "Passkey",
  "生物辨識",
  "Web3 錢包",
  "USDT",
  "USDC",
  "穩定幣",
  "非託管錢包",
];

// ============================================================================
// Page Metadata
// ============================================================================

/** 各頁面 SEO 配置 */
export const PAGE_SEO = {
  home: {
    title: "Keylio | 安全去中心化錢包",
    description: "安全、去中心化的 HD 錢包，支援 Plasma Chain。端對端加密保護你的數位資產。",
  },
  contacts: {
    title: "聯絡簿 | Keylio",
    description: "管理你的常用地址和聯絡人，快速轉帳給朋友。支援 QR Code 掃描和 NFC 交換。",
  },
  settings: {
    title: "設定 | Keylio",
    description: "自訂你的錢包設定：安全性、外觀、Passkey 管理和備份。",
  },
  swap: {
    title: "兌換 | Keylio",
    description: "在穩定幣之間快速兌換，USDT ↔ USDC 零手續費即時交換。",
  },
} as const;

// ============================================================================
// Open Graph
// ============================================================================

/** Open Graph 預設配置 */
export const OG_CONFIG = {
  type: "website",
  siteName: SITE_CONFIG.name,
  locale: SITE_CONFIG.locale,
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Keylio - 安全去中心化錢包",
    },
  ],
};

// ============================================================================
// Twitter Card
// ============================================================================

/** Twitter Card 配置 */
export const TWITTER_CONFIG = {
  card: "summary_large_image" as const,
  site: "@KeylioWallet",
  creator: "@KeylioWallet",
};

// ============================================================================
// Icons & Manifest
// ============================================================================

/** Favicon 和 App Icons 配置 */
export const ICONS_CONFIG = {
  icon: [
    { url: "/favicon.svg", type: "image/svg+xml" },
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
  ],
  apple: [
    { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  ],
  shortcut: "/favicon.ico",
};

/** PWA Manifest 配置 */
export const MANIFEST_CONFIG = {
  name: SITE_CONFIG.name,
  shortName: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  startUrl: "/",
  display: "standalone",
  backgroundColor: "#050505",
  themeColor: "#14b8a6",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
} as const;

// ============================================================================
// Robots
// ============================================================================

/** Robots 配置 */
export const ROBOTS_CONFIG = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
  },
};
