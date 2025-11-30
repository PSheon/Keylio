"use client";

import { useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";

type TimeRange = "7d" | "30d" | "90d";

interface AssetChartProps {
  totalValue: number;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  displayDate: string;
}

// Mock data generator - 在生產環境會從 API 獲取
const generateMockData = (days: number, baseValue: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  
  // Generate data with realistic volatility for stablecoins
  let value = baseValue * 0.95; // Start slightly lower
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Small random variation (±2% for stablecoins)
    const change = (Math.random() - 0.45) * 0.04 * value;
    value = Math.max(value + change, 0);
    
    // Trend towards current value
    if (i < days / 3) {
      value = value + (baseValue - value) * 0.1;
    }
    
    data.push({
      date: date.toISOString(),
      value: Math.round(value * 100) / 100,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
    });
  }
  
  // Ensure last value matches current total
  if (data.length > 0) {
    data[data.length - 1].value = baseValue;
  }
  
  return data;
};

// Custom Tooltip component
interface TooltipPayloadItem {
  value?: number;
  payload?: { displayDate?: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
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

/**
 * 資產變化圖表組件
 * Spec: Recharts 折線圖，支援 7/30/90 天切換
 * 直觀顯示漲跌趨勢 (綠色上升/紅色下降)
 */
export function AssetChart({ totalValue, className }: AssetChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  
  const timeRangeOptions: { value: TimeRange; label: string; days: number }[] = useMemo(() => [
    { value: "7d", label: "7天", days: 7 },
    { value: "30d", label: "30天", days: 30 },
    { value: "90d", label: "3月", days: 90 },
  ], []);
  
  // Generate chart data based on time range
  const chartData = useMemo(() => {
    const days = timeRangeOptions.find(o => o.value === timeRange)?.days || 30;
    return generateMockData(days, totalValue);
  }, [timeRange, totalValue, timeRangeOptions]);
  
  // Calculate change percentage
  const { changePercent, isPositive, hasData } = useMemo(() => {
    // No data or zero value - show empty state
    if (chartData.length < 2 || totalValue === 0) {
      return { changePercent: 0, isPositive: true, hasData: false };
    }
    
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    
    // Prevent division by zero
    if (firstValue === 0) {
      return { changePercent: 0, isPositive: true, hasData: true };
    }
    
    const change = ((lastValue - firstValue) / firstValue) * 100;
    
    return {
      changePercent: Math.abs(change),
      isPositive: change >= 0,
      hasData: true,
    };
  }, [chartData, totalValue]);
  
  // Chart gradient colors
  const gradientColor = isPositive ? "#14b8a6" : "#ef4444"; // teal or red
  
  return (
    <motion.div 
      variants={fadeInUp}
      className={cn(
        "bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-3 sm:p-4 lg:p-6",
        className
      )}
    >
      {/* Header - P1: 響應式間距 */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div>
          <p className="text-xs sm:text-sm text-keylio-text-muted mb-1">
            近 {timeRangeOptions.find(o => o.value === timeRange)?.days} 天變化
          </p>
          {hasData ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              )}
              <span className={cn(
                "text-base sm:text-lg font-semibold",
                isPositive ? "text-green-400" : "text-red-400"
              )}>
                {isPositive ? "+" : "-"}{changePercent.toFixed(2)}%
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-keylio-text-muted">
                暫無資料
              </span>
            </div>
          )}
        </div>
        
        {/* Time Range Selector - Spec: [7天][30天][3月] - P1: 響應式按鈕 */}
        <div className="flex gap-0.5 sm:gap-1 bg-keylio-bg-tertiary rounded-lg p-0.5 sm:p-1">
          {timeRangeOptions.map((option) => (
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
      
      {/* Chart Area - Spec: 桌面版寬度 400px，支持 hover 工具提示 */}
      {/* P1: 響應式高度 - 手機 140px, 桌面 200px */}
      <div className="h-[140px] sm:h-40 lg:h-[200px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                minTickGap={30}
              />
              <YAxis 
                hide
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: 'var(--keylio-border-primary)', strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={gradientColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                animationDuration={750}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-keylio-text-muted">
            <div className="w-16 h-16 mb-3 rounded-full bg-keylio-bg-tertiary flex items-center justify-center">
              <TrendingUp className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm">接收資產後即可查看走勢</p>
          </div>
        )}
      </div>
      
      {/* Last Update Time - Spec: 「更新於 X 分鐘前」 */}
      <div className="mt-3 text-center">
        <p className="text-xs text-keylio-text-muted">
          更新於剛剛
        </p>
      </div>
    </motion.div>
  );
}

export default memo(AssetChart);
