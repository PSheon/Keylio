import { type Metadata } from "next";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { PAGE_SEO, SITE_CONFIG, OG_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: PAGE_SEO.settings.title,
  description: PAGE_SEO.settings.description,
  openGraph: {
    title: PAGE_SEO.settings.title,
    description: PAGE_SEO.settings.description,
    url: `${SITE_CONFIG.url}/settings`,
    images: OG_CONFIG.images,
  },
  twitter: {
    title: PAGE_SEO.settings.title,
    description: PAGE_SEO.settings.description,
  },
};

/**
 * 設定頁面 - Server Component
 *
 * 負責：
 * 1. SEO metadata 定義
 * 2. 渲染 Client Component（SettingsContent）
 */
export default function SettingsPage() {
  return <SettingsContent />;
}
