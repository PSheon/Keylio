"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { Home, Users, Settings, X, LogOut, Clock, AlertTriangle } from "lucide-react";
import { BottomNavigation } from "@/components/navigation";
import { useRouterContext } from "@/components/providers/RouterProvider";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { useWalletStore } from "@/stores/useWalletStore";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const setUnlocked = useWalletStore((state) => state.setUnlocked);
  const destroySession = useWalletStore((state) => state.destroySession);
  const { navigateTo } = useRouterContext();
  const pathname = usePathname();

  // Track if session was ever active (to detect expiration vs initial load)
  const wasActiveRef = useRef(false);

  // Track user activity for auto-lock
  useActivityTracker({ enabled: true });

  // Session state from context
  const { isActive, timeRemaining } = useSessionContext();

  // Track when session becomes active
  useEffect(() => {
    if (isActive) {
      wasActiveRef.current = true;
    }
  }, [isActive]);

  // Compute warning state (no setState in effect)
  const showTimeWarning = useMemo(() =>
    timeRemaining < 60000 && timeRemaining > 0,
    [timeRemaining]
  );

  // Format time remaining
  const formatTimeRemaining = useCallback((ms: number) => {
    if (ms === Infinity) return "";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Auto-lock when session expires (only if it was previously active)
  const handleLogout = useCallback(() => {
    destroySession();
    setUnlocked(false);
    navigateTo("/");
  }, [destroySession, setUnlocked, navigateTo]);

  useEffect(() => {
    // Only auto-logout if session was previously active and is now inactive
    if (!isActive && wasActiveRef.current) {
      handleLogout();
    }
  }, [isActive, handleLogout]);

  // Spec: 左側導航選項（桌面版）- IA 優化後精簡為 3 項
  // 🏠 首頁 | 👥 聯絡簿 | ⚙️ 設定
  const navItems = [
    { icon: Home, label: "首頁", path: "/" },
    { icon: Users, label: "聯絡簿", path: "/contacts" },
    { icon: Settings, label: "設定", path: "/settings" },
  ];

  return (
    /**
     * Dashboard Layout 架構說明
     *
     * 高度約束鏈（Desktop）:
     * ┌─ Root Container (h-screen) ─────────────────────────────┐
     * │  ┌─ Testnet Banner (shrink-0, 可選) ──────────────────┐ │
     * │  └────────────────────────────────────────────────────┘ │
     * │  ┌─ App Container (flex-1 min-h-0) ───────────────────┐ │
     * │  │  ┌─ Sidebar ──┐  ┌─ Content Column ──────────────┐ │ │
     * │  │  │ h-full     │  │ flex-1 min-w-0 flex-col       │ │ │
     * │  │  │ flex-col   │  │ ┌─ Header (shrink-0) ───────┐ │ │ │
     * │  │  │            │  │ └───────────────────────────┘ │ │ │
     * │  │  │            │  │ ┌─ Main (flex-1 min-h-0) ───┐ │ │ │
     * │  │  │            │  │ │ overflow-y-auto            │ │ │ │
     * │  │  │            │  │ │ (唯一滾動區域)             │ │ │ │
     * │  │  │            │  │ └───────────────────────────┘ │ │ │
     * │  │  └────────────┘  └───────────────────────────────┘ │ │
     * │  └────────────────────────────────────────────────────┘ │
     * └─────────────────────────────────────────────────────────┘
     *
     * 關鍵點：
     * 1. Root 使用 h-screen 鎖定視窗高度
     * 2. flex-1 搭配 min-h-0 打破 flex item 預設的 min-height: auto
     * 3. 只有 <main> 可以滾動，其他區域都是固定的
     */
    <div className="h-screen bg-keylio-bg-primary text-keylio-text-primary flex flex-col overflow-hidden">
      {/* Testnet Warning Banner - P0: 測試網明顯標示 */}
      {ACTIVE_CHAIN.isTestnet ? <div className="shrink-0 bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2 z-50">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400 font-medium">
            ⚠️ 測試網路模式 ({ACTIVE_CHAIN.displayName}) - 資產不具真實價值
          </span>
        </div> : null}

      {/* App Container - flex-1 + min-h-0 建立高度約束 */}
      <div className="flex-1 min-h-0 flex relative">
        {/* Background Gradients (Unified with Welcome Screen) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>

        {/* Mobile Sidebar Overlay - 只在手機打開時顯示 */}
        {isSidebarOpen ? <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          /> : null}

        {/* Sidebar - Desktop: 固定寬度，佔滿父容器高度 */}
        <aside
          className={`
            fixed lg:relative inset-y-0 left-0 z-50 w-60 h-full
            bg-keylio-bg-secondary/80 backdrop-blur-xl border-r border-keylio-border-primary 
            transform transition-transform duration-300 ease-in-out
            hidden lg:flex lg:flex-col shrink-0
            ${isSidebarOpen ? "flex! translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Logo 區域 */}
          <div className="p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-teal-500 to-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-white"
                >
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-keylio-text-primary to-keylio-text-secondary">Keylio</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-keylio-text-secondary">
              <X size={24} />
            </button>
          </div>

          {/* 導航區域 - flex-1 + min-h-0 + overflow-y-auto */}
          <nav className="px-4 py-2 space-y-2 flex-1 min-h-0 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigateTo(item.path);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${pathname === item.path || (item.path === "/" && pathname === "/")
                    ? "bg-keylio-teal/10 text-keylio-teal shadow-sm border border-keylio-teal/20"
                    : "text-keylio-text-secondary hover:bg-keylio-bg-tertiary hover:text-keylio-text-primary hover:translate-x-1"
                  }
                `}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* 底部鎖定按鈕 */}
          <div className="p-4 border-t border-keylio-border-primary/50 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-keylio-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">鎖定錢包</span>
            </button>
          </div>
        </aside>

        {/* Content Column - flex-1 + min-w-0 + min-h-0 建立高度約束 */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col relative z-10">
          {/* Header - 固定高度 */}
          <header className="h-16 shrink-0 border-b border-keylio-border-primary/50 flex items-center justify-between px-4 lg:px-8 bg-keylio-bg-primary/60 backdrop-blur-xl z-30">
            <div className="flex items-center gap-4">
              {/* Mobile: Keylio Logo */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-teal-500 to-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 text-white"
                  >
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                </div>
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-keylio-text-primary to-keylio-text-secondary">Keylio</span>
              </div>
              {/* Desktop: Page title */}
              <h2 className="text-lg font-semibold hidden lg:block tracking-tight">首頁</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Auto-lock timer warning */}
              {showTimeWarning ? <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 animate-pulse">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-xs font-medium text-amber-400">
                    即將鎖定 {formatTimeRemaining(timeRemaining)}
                  </span>
                </div> : null}
              {/* Network indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.1)]">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-medium text-teal-400">{ACTIVE_CHAIN.displayName}</span>
              </div>
            </div>
          </header>

          {/* Main Content - 唯一可滾動區域 */}
          {/* flex-1 + min-h-0 確保高度被約束，overflow-y-auto 啟用滾動 */}
          <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8 pb-20 lg:pb-8 scrollbar-hide">
            <div className="max-w-5xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
}
