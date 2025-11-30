import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { type Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SessionInitializer } from "@/components/providers/SessionInitializer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Keylio Wallet",
  description: "Decentralized HD Wallet for Plasma Chain",
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
            <SessionProvider>
              <SessionInitializer />
              {children}
              <Toaster richColors position="top-center" />
            </SessionProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
