import { type Metadata } from "next";
import { HomeContent } from "@/components/home/HomeContent";
import { SITE_CONFIG, SITE_KEYWORDS, OG_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: SITE_KEYWORDS,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: OG_CONFIG.images,
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: OG_CONFIG.images,
  },
};

/**
 * 首頁 - Server Component
 *
 * 負責：
 * 1. SEO metadata 定義
 * 2. 渲染 Client Component（HomeContent）
 */
export default function Home() {
  return <HomeContent />;
}
