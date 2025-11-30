import { Geist, Geist_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
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
