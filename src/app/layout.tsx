import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { type Metadata, type Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RouterProvider } from "@/components/providers/RouterProvider";
import { SessionInitializer } from "@/components/providers/SessionInitializer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import {
  SITE_CONFIG,
  SITE_KEYWORDS,
  PAGE_SEO,
  OG_CONFIG,
  TWITTER_CONFIG,
  ICONS_CONFIG,
  ROBOTS_CONFIG,
} from "@/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  // Base URL for resolving relative URLs
  metadataBase: new URL(SITE_CONFIG.url),

  // Basic
  title: {
    default: PAGE_SEO.home.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,

  // Manifest
  manifest: "/manifest.json",

  // Icons
  icons: ICONS_CONFIG,

  // Open Graph
  openGraph: {
    type: "website",
    locale: OG_CONFIG.locale,
    url: SITE_CONFIG.url,
    siteName: OG_CONFIG.siteName,
    title: PAGE_SEO.home.title,
    description: SITE_CONFIG.description,
    images: OG_CONFIG.images,
  },

  // Twitter
  twitter: {
    card: TWITTER_CONFIG.card,
    site: TWITTER_CONFIG.site,
    creator: TWITTER_CONFIG.creator,
    title: PAGE_SEO.home.title,
    description: SITE_CONFIG.description,
    images: OG_CONFIG.images,
  },

  // Robots
  robots: ROBOTS_CONFIG,

  // App Links
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_CONFIG.name,
  },

  // Format Detection
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme from cookie (Server-side)
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("keylio-theme")?.value;

  // Resolve theme class for SSR (prevents flash)
  let themeClass: "light" | "dark" = "dark";
  if (themeCookie === "light") {
    themeClass = "light";
  } else if (themeCookie === "system") {
    // For system theme, we default to dark on server
    // Client will correct this if needed (minimal flash for system users only)
    themeClass = "dark";
  }

  return (
    <html lang="zh-TW" className={themeClass} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeProvider>
            <RouterProvider>
              <SessionProvider>
                <SessionInitializer />
                {children}
                <Toaster richColors position="bottom-center" />
              </SessionProvider>
            </RouterProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
