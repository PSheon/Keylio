import { type Metadata } from "next";
import { ContactsContent } from "@/components/contacts/ContactsContent";
import { PAGE_SEO, SITE_CONFIG, OG_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: PAGE_SEO.contacts.title,
  description: PAGE_SEO.contacts.description,
  openGraph: {
    title: PAGE_SEO.contacts.title,
    description: PAGE_SEO.contacts.description,
    url: `${SITE_CONFIG.url}/contacts`,
    images: OG_CONFIG.images,
  },
  twitter: {
    title: PAGE_SEO.contacts.title,
    description: PAGE_SEO.contacts.description,
  },
};

/**
 * 聯絡簿頁面 - Server Component
 *
 * 負責：
 * 1. SEO metadata 定義
 * 2. 渲染 Client Component（ContactsContent）
 */
export default function ContactsPage() {
  return <ContactsContent />;
}
