"use client";

import { memo, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Info, TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePortfolioHistory } from "@/hooks/usePortfolioHistory";
import { fadeInUp } from "@/lib/animations";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** TWD 匯率（實際應從 API 獲取） */
const USD_TO_TWD = 32.5;

type TimeRange = "7d" | "30d" | "90d";

interface PortfolioOverviewProps {
  /** 總資產 USD 價值 */
  totalValueUSD: number;
  /** 子錢包 ID（用於查詢歷史快照） */
  subWalletId?: number;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 是否有錯誤 */
  hasError: boolean;
}

// Custom Tooltip component for chart
interface TooltipPayloadItem {
  value?: number;
  payload?: { displayDate?: string };
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomChartTooltip = ({ active, payload }: CustomChartTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-keylio-bg-secondary border border-keylio-border-primary rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-keylio-text-muted">{payload[0]?.payload?.displayDate}</p>
        <p className="text-sm font-semibold text-keylio-text-primary">
          ${payload[0]?.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: "7d", label: "7天", days: 7 },
  { value: "30d", label: "30天", days: 30 },
  { value: "90d", label: "3月", days: 90 },
];

/**
 * Portfolio Overview - 整合總資產 + 趨勢圖表
 *
 * 設計重點：
 * 1. 上半部：總資產金額 + TWD 等值 + 眼睛/Info 按鈕
 * 2. 下半部：時間範圍選擇 + 變化百分比 + 趨勢圖表
 * 3. 單一卡片整合，減少視覺碎片
 */
function PortfolioOverviewComponent({
  totalValueUSD,
  subWalletId,
  isLoading,
  hasError,
}: PortfolioOverviewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const hideBalancesSetting = useSettingsStore((state) => state.hideBalances);
  const setHideBalances = useSettingsStore((state) => state.setHideBalances);

  // 眼睛按鈕直接切換全域設定
  const toggleHideBalances = () => {
    setHideBalances(hideBalancesSetting === 'always-hide' ? 'always-show' : 'always-hide');
  };

  const shouldHide = hideBalancesSetting === 'always-hide';

  // 計算 TWD 等值
  const totalTWD = totalValueUSD * USD_TO_TWD;

  // 取得當前選擇的天數
  const currentDays = useMemo(() =>
    TIME_RANGE_OPTIONS.find(o => o.value === timeRange)?.days || 30,
    [timeRange]
  );

  // 使用 portfolio history hook 取得真實歷史資料
  const {
    chartData,
    changePercent,
    isPositive,
    hasHistory,
  } = usePortfolioHistory({
    subWalletId,
    currentValueUSD: totalValueUSD,
    days: currentDays,
  });

  // 是否有資料可顯示
  const hasData = totalValueUSD > 0 || hasHistory;

  // 圖表顏色
  const gradientColor = isPositive ? "#14b8a6" : "#ef4444";

  return (
    <motion.div variants={fadeInUp}>
      <div className="w-full bg-linear-to-br from-keylio-bg-secondary to-keylio-bg-secondary/80 rounded-2xl border border-keylio-border-primary overflow-hidden">
        {/* ===== 上半部：總資產 ===== */}
        <div className="p-5 lg:p-6">
          {/* 頂部標籤列 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-keylio-text-muted">總資產</span>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button className="p-1.5 hover:bg-keylio-bg-tertiary rounded-lg transition-colors">
                      <Info className="w-4 h-4 text-keylio-text-muted" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="text-xs">
                      總資產包含所有穩定幣與其他代幣的加總價值，以當前匯率換算。
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
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
              <h1 className="text-4xl lg:text-5xl font-bold text-keylio-text-primary tracking-tight">
                {shouldHide ? "••••••" : formatCurrency(totalValueUSD)}
              </h1>
              <p className="text-base text-keylio-text-muted mt-1">
                {shouldHide
                  ? "••••••"
                  : `≈ NT$ ${totalTWD.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`
                }
              </p>
            </div>
          )}
        </div>

        {/* ===== 分隔線 ===== */}
        <div className="border-t border-keylio-border-primary" />

        {/* ===== 下半部：趨勢圖表 ===== */}
        <div className="p-4 lg:p-6 pt-4">
          {/* 圖表 Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs sm:text-sm text-keylio-text-muted mb-1">
                近 {currentDays} 天變化
              </p>
              {isLoading ? (
                <Skeleton className="h-6 w-20 bg-keylio-bg-tertiary" />
              ) : hasData ? (
                <div className="flex items-center gap-1.5">
                  {isPositive ? (
                    <TrendingUp className={cn(
                      "w-4 h-4",
                      changePercent > 0 ? "text-keylio-teal" : "text-keylio-text-muted"
                    )} />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className={cn(
                    "text-base font-semibold",
                    changePercent === 0
                      ? "text-keylio-text-muted"
                      : isPositive
                        ? "text-keylio-teal"
                        : "text-red-400"
                  )}>
                    {changePercent === 0 ? "0.00%" : `${isPositive ? "+" : "-"}${changePercent.toFixed(2)}%`}
                  </span>
                </div>
              ) : (
                <span className="text-base font-semibold text-keylio-text-muted">
                  暫無資料
                </span>
              )}
            </div>

            {/* Time Range Selector */}
            <div className="flex gap-0.5 sm:gap-1 bg-keylio-bg-tertiary rounded-lg p-0.5 sm:p-1">
              {TIME_RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={cn(
                    "px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all touch-manipulation",
                    timeRange === option.value
                      ? "bg-keylio-teal text-white shadow-sm"
                      : "text-keylio-text-secondary hover:text-keylio-text-primary"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Area */}
          <div className="h-[120px] sm:h-[140px] lg:h-40 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full bg-keylio-bg-tertiary rounded-lg" />
              </div>
            ) : hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="displayDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'var(--keylio-text-muted)' }}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip
                    content={<CustomChartTooltip />}
                    cursor={{ stroke: 'var(--keylio-border-primary)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={gradientColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#portfolioGradient)"
                    animationDuration={750}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-keylio-text-muted">
                <div className="w-12 h-12 mb-2 rounded-full bg-keylio-bg-tertiary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 opacity-30" />
                </div>
                <p className="text-sm">接收資產後即可查看走勢</p>
              </div>
            )}
          </div>

          {/* Last Update */}
          <div className="mt-2 text-center">
            <p className="text-xs text-keylio-text-muted">更新於剛剛</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const PortfolioOverview = memo(PortfolioOverviewComponent);
