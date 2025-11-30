"use client";

import { memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
}

/**
 * 精簡導航項目 (IA 優化)
 * - 首頁：錢包控制台，整合資產概覽
 * - 聯絡簿：管理聯絡人
 * - 設定：整合原帳戶頁面功能
 */
const navItems: NavItem[] = [
  { icon: Home, label: "首頁", path: "/" },
  { icon: Users, label: "聯絡簿", path: "/contacts" },
  { icon: Settings, label: "設定", path: "/settings" },
];

/**
 * 手機版底部導航組件
 * Spec: lg 以下顯示，3 個導航選項
 * [🏠 首頁] [👥 聯絡簿] [⚙️ 設定]
 */
export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-keylio-border-primary bg-keylio-bg-secondary/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.path || 
            (item.path === "/" && pathname === "/") ||
            (item.path !== "/" && pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full",
                "transition-colors duration-200 touch-manipulation",
                "active:scale-95",
                isActive 
                  ? "text-keylio-teal" 
                  : "text-keylio-text-secondary hover:text-keylio-text-primary"
              )}
            >
              <div className="relative">
                <item.icon 
                  size={22} 
                  className={cn(
                    "transition-transform duration-200",
                    isActive && "scale-110"
                  )} 
                />
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-keylio-teal"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-keylio-teal" : "text-keylio-text-muted"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(BottomNavigation);
