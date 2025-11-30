"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fadeInUp } from "@/lib/animations";
import { formatCurrency } from "@/lib/formatters";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** TWD 匯率（實際應從 API 獲取） */
const USD_TO_TWD = 32.5;

interface PortfolioBalanceProps {
  /** 總資產 USD 價值 */
  totalValueUSD: number;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 是否有錯誤 */
  hasError: boolean;
}

/**
 * 全局總資產 KPI 區塊 (View-only)
 * 
 * 設計重點：
 * 1. 只顯示「總資產」$X + ≈ NT$ 參考價
 * 2. 右側眼睛 icon 控制顯示/隱藏（全局同步）
 * 3. Info icon 顯示 tooltip 說明資產組成
 * 4. 純展示卡片，不可點擊開啟 Dialog（深度檢視入口移到穩定幣卡）
 */
function PortfolioBalanceComponent({
  totalValueUSD,
  isLoading,
  hasError,
}: PortfolioBalanceProps) {
  const hideBalancesSetting = useSettingsStore((state) => state.hideBalances);
  const setHideBalances = useSettingsStore((state) => state.setHideBalances);
  
  // 本地狀態用於 'hide-on-start' 模式下的眼睛圖示切換
  const [localHidden, setLocalHidden] = useState(true);
  
  const toggleHideBalances = () => {
    if (hideBalancesSetting === 'always-show' || hideBalancesSetting === 'always-hide') {
      // 如果是固定設定，切換到另一個固定設定
      setHideBalances(hideBalancesSetting === 'always-show' ? 'always-hide' : 'always-show');
    } else {
      // 'hide-on-start' 模式下只切換本地狀態
      setLocalHidden(!localHidden);
    }
  };
  
  // 根據設定計算是否應該隱藏
  const shouldHide = 
    hideBalancesSetting === 'always-hide' || 
    (hideBalancesSetting === 'hide-on-start' && localHidden);

  // 計算 TWD 等值
  const totalTWD = totalValueUSD * USD_TO_TWD;

  return (
    <motion.div variants={fadeInUp}>
      <div
        className="w-full bg-linear-to-br from-keylio-bg-secondary to-keylio-bg-secondary/80 rounded-2xl border border-keylio-border-primary p-5 lg:p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
      >
        {/* 頂部標籤列 */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-keylio-text-muted">總資產</span>
          <div className="flex items-center gap-1">
            {/* Info icon - tooltip 說明資產組成 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-1.5 hover:bg-keylio-bg-tertiary rounded-lg transition-colors"
                  >
                    <Info className="w-4 h-4 text-keylio-text-muted" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-xs">
                    總資產包含所有穩定幣與其他代幣的加總價值，以當前匯率換算。
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* 眼睛 icon - 控制隱藏 */}
            <button
              onClick={toggleHideBalances}
              className="p-1.5 hover:bg-keylio-bg-tertiary rounded-lg transition-colors"
              title={shouldHide ? "顯示餘額" : "隱藏餘額"}
            >
              {shouldHide ? (
                <EyeOff className="w-4 h-4 text-keylio-text-muted" />
              ) : (
                <Eye className="w-4 h-4 text-keylio-text-muted" />
              )}
            </button>
          </div>
        </div>

        {/* 金額顯示 */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-48 bg-keylio-bg-tertiary" />
            <Skeleton className="h-5 w-32 bg-keylio-bg-tertiary" />
          </div>
        ) : hasError ? (
          <div className="text-red-400 text-2xl font-bold">連接失敗</div>
        ) : (
          <div>
            {/* USD 金額 - 主要顯示 */}
            <h1 className="text-4xl lg:text-5xl font-bold text-keylio-text-primary tracking-tight">
              {shouldHide ? "••••••" : formatCurrency(totalValueUSD)}
            </h1>
            {/* TWD 參考價 */}
            <p className="text-base text-keylio-text-muted mt-1">
              {shouldHide 
                ? "••••••" 
                : `≈ NT$ ${totalTWD.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`
              }
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const PortfolioBalance = memo(PortfolioBalanceComponent);
