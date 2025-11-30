"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatUSD, formatTokenBalance } from "@/lib/formatters";
import { ACTIVE_CHAIN } from "@/lib/chain";

/** StablecoinRow 變體 */
export type StablecoinRowVariant = "default" | "compact" | "detailed";

/** 穩定幣資料 */
export interface StablecoinData {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  valueUSD: number;
  /** 佔總穩定幣的百分比 (0-100) */
  percentage?: number;
  /** 合約地址 */
  contractAddress?: string;
  /** 是否為主流穩定幣 */
  isMainstream?: boolean;
}

interface StablecoinRowProps {
  /** 穩定幣資料 */
  coin: StablecoinData;
  /** 顯示變體 */
  variant?: StablecoinRowVariant;
  /** 是否隱藏餘額 */
  hideBalance?: boolean;
  /** 點擊時觸發 */
  onClick?: () => void;
}

/**
 * 穩定幣列表行元件
 * 支援三種變體：
 * - default: 首頁穩定幣列表
 * - compact: 緊湊版（用於對話框或小空間）
 * - detailed: 詳細版（完整資產列表用）
 */
function StablecoinRowComponent({
  coin,
  variant = "default",
  hideBalance = false,
  onClick,
}: StablecoinRowProps) {
  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coin.contractAddress) {
      navigator.clipboard.writeText(coin.contractAddress);
      toast.success("合約地址已複製");
    }
  };

  const handleOpenExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (coin.contractAddress && ACTIVE_CHAIN.explorerUrl) {
      window.open(`${ACTIVE_CHAIN.explorerUrl}/token/${coin.contractAddress}`, "_blank");
    }
  };

  // Compact 模式：最簡顯示
  if (variant === "compact") {
    return (
      <motion.div
        variants={staggerItem}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-colors",
          onClick && "cursor-pointer hover:bg-keylio-bg-tertiary"
        )}
      >
        <span className="text-lg">{coin.icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-keylio-text-primary">
            {coin.symbol}
          </span>
        </div>
        <span className="text-sm font-semibold text-keylio-text-primary">
          {hideBalance ? "••••" : formatUSD(coin.valueUSD)}
        </span>
      </motion.div>
    );
  }

  // Detailed 模式：完整資訊
  if (variant === "detailed") {
    return (
      <motion.div
        variants={staggerItem}
        onClick={onClick}
        className={cn(
          "flex items-center justify-between p-4 rounded-xl border border-keylio-border-primary transition-colors group",
          onClick
            ? "cursor-pointer bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary"
            : "bg-keylio-bg-secondary"
        )}
      >
        {/* Left: Icon & Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-keylio-bg-tertiary flex items-center justify-center text-xl">
            {coin.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-keylio-text-primary">
                {coin.symbol}
              </span>
              {coin.isMainstream && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-keylio-teal/10 text-keylio-teal">
                  主流
                </span>
              )}
            </div>
            <div className="text-xs text-keylio-text-muted">{coin.name}</div>
          </div>
        </div>

        {/* Middle: Balance & Percentage */}
        <div className="flex-1 px-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-keylio-text-muted">
              {hideBalance ? "••••" : formatTokenBalance(coin.balance)} {coin.symbol}
            </span>
            {coin.percentage !== undefined && (
              <span className="text-keylio-text-secondary font-medium">
                {coin.percentage.toFixed(1)}%
              </span>
            )}
          </div>
          {coin.percentage !== undefined && (
            <Progress
              value={coin.percentage}
              className="h-1 bg-keylio-bg-tertiary"
            />
          )}
        </div>

        {/* Right: Value & Actions */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-semibold text-keylio-text-primary">
              {hideBalance ? "••••••" : formatUSD(coin.valueUSD)}
            </div>
            <div className="text-xs text-keylio-text-muted">USD 等值</div>
          </div>

          {/* Actions - show on hover */}
          {coin.contractAddress && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="h-7 w-7 p-0"
              >
                <Copy className="w-3.5 h-3.5 text-keylio-text-muted" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExplorer}
                className="h-7 w-7 p-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-keylio-text-muted" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Default 模式：首頁穩定幣列表
  return (
    <motion.div
      variants={staggerItem}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl transition-colors",
        onClick
          ? "cursor-pointer bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary border border-keylio-border-primary"
          : "bg-keylio-bg-secondary/50"
      )}
    >
      {/* Left: Icon & Name */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-keylio-bg-tertiary flex items-center justify-center text-lg">
          {coin.icon}
        </div>
        <div>
          <div className="font-medium text-keylio-text-primary text-sm">
            {coin.symbol}
          </div>
          <div className="text-xs text-keylio-text-muted">
            {hideBalance ? "••••" : formatTokenBalance(coin.balance)}
          </div>
        </div>
      </div>

      {/* Right: Value & Percentage */}
      <div className="text-right flex items-center gap-3">
        <div>
          <div className="font-semibold text-keylio-text-primary text-sm">
            {hideBalance ? "••••" : formatUSD(coin.valueUSD)}
          </div>
          {coin.percentage !== undefined && (
            <div className="text-xs text-keylio-text-muted">
              {coin.percentage.toFixed(0)}%
            </div>
          )}
        </div>

        {/* Mini Progress Bar */}
        {coin.percentage !== undefined && (
          <div className="w-12 h-1.5 bg-keylio-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-keylio-teal rounded-full transition-all"
              style={{ width: `${Math.min(coin.percentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

export const StablecoinRow = memo(StablecoinRowComponent);
