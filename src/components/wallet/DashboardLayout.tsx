"use client";

import { useState } from "react";
import { Wallet, Settings, Menu, X, LogOut, PieChart, ArrowRightLeft } from "lucide-react";
import { useWalletStore } from "@/stores/useWalletStore";
import { useRouter, usePathname } from "next/navigation";
import { ACTIVE_CHAIN } from "@/lib/chain";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const setUnlocked = useWalletStore((state) => state.setUnlocked);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    setUnlocked(false);
    router.push("/");
  };

  const navItems = [
    { icon: Wallet, label: "我的錢包", path: "/" },
    { icon: ArrowRightLeft, label: "交易記錄", path: "/transactions" },
    { icon: PieChart, label: "資產分析", path: "/analytics" },
    { icon: Settings, label: "設定", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-keylio-bg-primary text-keylio-text-primary flex relative overflow-hidden">
      {/* Background Gradients (Unified with Welcome Screen) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-64 
          bg-keylio-bg-secondary/80 backdrop-blur-xl border-r border-keylio-border-primary 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-6 flex justify-between items-center">
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
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-keylio-text-secondary">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 py-2 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                router.push(item.path);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${pathname === item.path 
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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-keylio-border-primary/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-keylio-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">鎖定錢包</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-keylio-border-primary/50 flex items-center justify-between px-4 md:px-8 bg-keylio-bg-primary/60 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-keylio-text-secondary hover:text-keylio-text-primary"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold hidden md:block tracking-tight">我的錢包</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 shadow-[0_0_10px_rgba(20,184,166,0.1)]">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-xs font-medium text-teal-400">{ACTIVE_CHAIN.displayName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-5xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
