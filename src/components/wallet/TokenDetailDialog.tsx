"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  ChevronDown,
  ExternalLink,
  Send,
  ArrowDownToLine,
  ArrowUpDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { TokenIcon } from "@/components/ui/token-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { formatCurrency, formatTokenBalance, formatPercent, shortenAddress } from "@/lib/formatters";
import { showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface TokenDetailData {
  /** 代幣符號 */
  symbol: string;
  /** 代幣名稱 */
  name: string;
  /** 持有數量（格式化後） */
  balance: string;
  /** USD 價值 */
  valueUSD: number;
  /** 合約地址（原生代幣為 0x0） */
  contractAddress: string;
  /** 小數位數 */
  decimals?: number;
  /** 是否為原生代幣 */
  isNative?: boolean;
  /** 24h 漲跌幅（百分比） */
  change24h?: number;
}

interface TokenDetailDialogProps {
  /** 代幣資料 */
  token: TokenDetailData | null;
  /** Dialog 開啟狀態 */
  open: boolean;
  /** 關閉 Dialog 回調 */
  onOpenChange: (open: boolean) => void;
  /** 是否隱藏餘額 */
  hideBalance?: boolean;
  /** 發送按鈕點擊 */
  onSend?: () => void;
  /** 接收按鈕點擊 */
  onReceive?: () => void;
  /** 兌換按鈕點擊 */
  onSwap?: () => void;
}

// ============================================
// Mock 價格數據（Phase 1 使用）
// ============================================

interface MockPriceData {
  currentPrice: number;
  change24h: number;
  change24hAmount: number;
  high24h: number;
  low24h: number;
  marketRank?: number;
  // 持有相關
  yesterdayValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

const getMockPriceData = (symbol: string, balance: string, valueUSD: number): MockPriceData => {
  const numBalance = parseFloat(balance);

  // Mock 價格數據
  const mockPrices: Record<string, { price: number; change: number; rank?: number }> = {
    ETH: { price: 2000.50, change: 2.34, rank: 2 },
    XPL: { price: 0.0105, change: -1.25, rank: 850 },
    USDT: { price: 1.0001, change: 0.01, rank: 3 },
    USDC: { price: 0.9999, change: -0.02, rank: 6 },
    WBTC: { price: 43500, change: 1.56, rank: 15 },
  };

  const priceInfo = mockPrices[symbol.toUpperCase()] || { price: 1, change: 0 };
  const currentPrice = priceInfo.price;
  const change24h = priceInfo.change;
  const change24hAmount = currentPrice * (change24h / 100);

  // 計算昨日價值和漲虧
  const yesterdayPrice = currentPrice / (1 + change24h / 100);
  const yesterdayValue = numBalance * yesterdayPrice;
  const profitLoss = valueUSD - yesterdayValue;
  const profitLossPercent = yesterdayValue > 0 ? (profitLoss / yesterdayValue) * 100 : 0;

  return {
    currentPrice,
    change24h,
    change24hAmount,
    high24h: currentPrice * 1.03,
    low24h: currentPrice * 0.97,
    marketRank: priceInfo.rank,
    yesterdayValue,
    profitLoss,
    profitLossPercent,
  };
};

// ============================================
// Sub Components
// ============================================

/** 代幣類型 Badge */
type TokenType = "native" | "erc20" | "stablecoin";

function TokenTypeBadge({ type }: { type: TokenType }) {
  const config: Record<TokenType, { label: string; className: string }> = {
    native: {
      label: "原生代幣",
      className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    },
    erc20: {
      label: "ERC-20",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
    stablecoin: {
      label: "穩定幣",
      className: "bg-green-500/10 text-green-400 border-green-500/20",
    },
  };

  const { label, className } = config[type];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border",
        className
      )}
    >
      {label}
    </span>
  );
}

/** 網路 Badge */
function NetworkBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-keylio-bg-tertiary text-keylio-text-muted border border-keylio-border-primary">
      <span className="w-1.5 h-1.5 rounded-full bg-keylio-teal" />
      {ACTIVE_CHAIN.displayName}
    </span>
  );
}

/** 價格變化指示器 */
function PriceChangeIndicator({
  change,
  amount,
  size = "md",
}: {
  change: number;
  amount?: number;
  size?: "sm" | "md";
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const colorClass = isPositive
    ? "text-green-400"
    : isNegative
    ? "text-red-400"
    : "text-keylio-text-muted";

  const sizeClass = size === "sm" ? "text-xs" : "text-sm";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <div className={cn("flex items-center gap-1", colorClass, sizeClass)}>
      <Icon className={iconSize} />
      <span className="font-medium">
        {isPositive ? "+" : ""}
        {formatPercent(change, { showSign: false })}
      </span>
      {amount !== undefined && (
        <span className="text-keylio-text-muted">
          ({isPositive ? "+" : ""}
          {formatCurrency(amount)})
        </span>
      )}
    </div>
  );
}

/** 可複製的資訊列 */
function CopyableInfoRow({
  label,
  value,
  fullValue,
}: {
  label: string;
  value: string;
  fullValue: string;
}) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullValue);
    showSuccess(`${label}已複製`);
  }, [fullValue, label]);

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-keylio-bg-tertiary/50 transition-colors group text-left"
    >
      <span className="text-sm text-keylio-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm font-medium text-keylio-text-primary font-mono">
                {value}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[300px] break-all">
              <p className="font-mono text-xs">{fullValue}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Copy className="w-3.5 h-3.5 text-keylio-text-muted/50 group-hover:text-keylio-text-muted transition-colors" />
      </div>
    </button>
  );
}

/** 資訊列（不可複製） */
function InfoRow({
  label,
  value,
  tooltip,
  valueClassName,
}: {
  label: string;
  value: string;
  tooltip?: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-1.5 text-keylio-text-muted">
        <span className="text-sm">{label}</span>
        {tooltip ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-keylio-text-muted/50 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>
      <span
        className={cn(
          "text-sm font-medium text-keylio-text-primary",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

function TokenDetailDialogComponent({
  token,
  open,
  onOpenChange,
  hideBalance = false,
  onSend,
  onReceive,
  onSwap,
}: TokenDetailDialogProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // 計算代幣類型
  const tokenType = useMemo((): TokenType => {
    if (!token) return "erc20";
    if (token.isNative) return "native";
    if (["USDT", "USDC", "DAI"].includes(token.symbol.toUpperCase())) {
      return "stablecoin";
    }
    return "erc20";
  }, [token]);

  // 取得 Mock 價格數據
  const priceData = useMemo(() => {
    if (!token) return null;
    return getMockPriceData(token.symbol, token.balance, token.valueUSD);
  }, [token]);

  // Early return
  if (!token || !priceData) return null;

  const isNativeToken = token.isNative || token.contractAddress === "0x0000000000000000000000000000000000000000";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <TokenIcon symbol={token.symbol} size="32px" />
            <span>{token.name}</span>
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* ====== 持有數量區塊 ====== */}
          <div className="text-center py-4">
            {/* 持有數量（大字） */}
            <h2 className="text-3xl font-bold text-keylio-text-primary mb-1">
              {hideBalance
                ? "••••••"
                : `${formatTokenBalance(token.balance)} ${token.symbol}`}
            </h2>

            {/* 法幣價值 */}
            <p className="text-lg text-keylio-text-secondary mb-2">
              {hideBalance ? "••••" : `≈ ${formatCurrency(token.valueUSD)}`}
            </p>

            {/* 今日漲虧 */}
            <div className="flex items-center justify-center gap-2">
              {!hideBalance && (
                <>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      priceData.profitLoss >= 0 ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {priceData.profitLoss >= 0 ? "+" : ""}
                    {formatCurrency(priceData.profitLoss)}
                  </span>
                  <span className="text-xs text-keylio-text-muted">
                    ({priceData.profitLossPercent >= 0 ? "+" : ""}
                    {priceData.profitLossPercent.toFixed(2)}%) 今日
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ====== 價格資訊區塊 ====== */}
          <div className="bg-keylio-bg-tertiary/50 rounded-xl border border-keylio-border-primary p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 當前價格 */}
              <div>
                <p className="text-xs text-keylio-text-muted mb-1">當前價格</p>
                <p className="text-lg font-semibold text-keylio-text-primary">
                  {formatCurrency(priceData.currentPrice)}
                </p>
              </div>

              {/* 24h 變化 */}
              <div>
                <p className="text-xs text-keylio-text-muted mb-1">24h 變化</p>
                <PriceChangeIndicator
                  change={priceData.change24h}
                  amount={priceData.change24hAmount}
                />
              </div>

              {/* 24h 高/低 */}
              <div>
                <p className="text-xs text-keylio-text-muted mb-1">24h 高/低</p>
                <p className="text-sm text-keylio-text-primary">
                  {formatCurrency(priceData.low24h)} ~ {formatCurrency(priceData.high24h)}
                </p>
              </div>

              {/* 市場排名 */}
              {priceData.marketRank ? (
                <div>
                  <p className="text-xs text-keylio-text-muted mb-1">市場排名</p>
                  <p className="text-sm font-medium text-keylio-text-primary">
                    #{priceData.marketRank}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* ====== 標籤區塊 ====== */}
          <div className="flex items-center gap-2 flex-wrap">
            <TokenTypeBadge type={tokenType} />
            <NetworkBadge />
          </div>

          {/* ====== 技術細節（可折疊） ====== */}
          <div className="bg-keylio-bg-tertiary/30 rounded-xl border border-keylio-border-primary overflow-hidden">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-keylio-bg-tertiary/50 transition-colors"
            >
              <span className="text-sm text-keylio-text-muted">技術細節</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-keylio-text-muted transition-transform duration-200",
                  showTechnicalDetails && "rotate-180"
                )}
              />
            </button>

            <AnimatePresence>
              {showTechnicalDetails ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="divide-y divide-keylio-border-primary border-t border-keylio-border-primary"
                >
                  {/* 合約地址 */}
                  {!isNativeToken && (
                    <CopyableInfoRow
                      label="合約地址"
                      value={shortenAddress(token.contractAddress, {
                        startChars: 8,
                        endChars: 6,
                      })}
                      fullValue={token.contractAddress}
                    />
                  )}

                  {/* Decimals */}
                  <InfoRow
                    label="Decimals"
                    value={String(token.decimals ?? 18)}
                    tooltip="代幣的小數位數"
                  />

                  {/* 網路 */}
                  <InfoRow
                    label="網路"
                    value={ACTIVE_CHAIN.displayName}
                  />

                  {/* 區塊瀏覽器連結 */}
                  {!isNativeToken && (
                    <a
                      href={`${ACTIVE_CHAIN.explorerUrl}/token/${token.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 hover:bg-keylio-bg-tertiary/50 transition-colors text-keylio-teal"
                    >
                      <span className="text-sm">在區塊瀏覽器查看</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* ====== 操作按鈕 ====== */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button
              variant="outline"
              className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
              onClick={onSend}
            >
              <Send className="w-4 h-4 mr-1.5" />
              發送
            </Button>
            <Button
              variant="outline"
              className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
              onClick={onReceive}
            >
              <ArrowDownToLine className="w-4 h-4 mr-1.5" />
              接收
            </Button>
            <Button
              variant="outline"
              className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
              onClick={onSwap}
            >
              <ArrowUpDown className="w-4 h-4 mr-1.5" />
              兌換
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export const TokenDetailDialog = memo(TokenDetailDialogComponent);
