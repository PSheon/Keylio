import { type Metadata } from "next";
import { SwapContent } from "@/components/swap/SwapContent";
import { PAGE_SEO, SITE_CONFIG, OG_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: PAGE_SEO.swap.title,
  description: PAGE_SEO.swap.description,
  openGraph: {
    title: PAGE_SEO.swap.title,
    description: PAGE_SEO.swap.description,
    url: `${SITE_CONFIG.url}/swap`,
    images: OG_CONFIG.images,
  },
  twitter: {
    title: PAGE_SEO.swap.title,
    description: PAGE_SEO.swap.description,
  },
};

/**
 * 兌換頁面 - Server Component
 *
 * 負責：
 * 1. SEO metadata 定義
 * 2. 渲染 Client Component（SwapContent）
 */
export default function SwapPage() {
  return <SwapContent />;
}
