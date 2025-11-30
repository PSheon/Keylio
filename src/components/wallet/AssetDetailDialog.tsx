"use client";

import { useState, useMemo, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowDownToLine,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { ReceiveDialog } from "@/components/transaction/ReceiveDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMultiTokenBalance } from "@/hooks/useTokenBalance";
import { staggerItem, staggerContainer } from "@/lib/animations";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { formatUSD, formatCurrency, formatTokenBalance, formatPercent } from "@/lib/formatters";
import { getAllTokens, formatTokenAmount, getTokenValueUSD } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useWalletStore } from "@/stores/useWalletStore";
import { StablecoinRow, type StablecoinData } from "./StablecoinRow";

interface AssetDetailDialogProps {
  /** 觸發器元素 */
  trigger: React.ReactNode;
}

/** 排序選項 */
type SortOption = 'value-desc' | 'value-asc' | 'name-asc' | 'balance-desc';

/**
 * 全資產詳細 Dialog
 * 顯示完整的穩定幣餘額和其他資產，支援搜尋和排序
 */
function AssetDetailDialogComponent({ trigger }: AssetDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOtherAssets, setShowOtherAssets] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('value-desc');

  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const hideBalancesSetting = useSettingsStore((state) => state.hideBalances);

  // 將設定轉換為 boolean
  const hideBalances = hideBalancesSetting === 'always-hide' || hideBalancesSetting === 'hide-on-start';

  const activeWallet = wallets.find(w => w.id === activeWalletId);

  // Get all tokens
  const allTokens = useMemo(() => getAllTokens(), []);
  const stablecoins = useMemo(() =>
    allTokens.filter(t => t.symbol === 'USDT' || t.symbol === 'USDC'),
    [allTokens]
  );
  const tokenAddresses = useMemo(() => allTokens.map(t => t.address), [allTokens]);

  // Fetch balances
  const { data: balances, isLoading, error, refetch } = useMultiTokenBalance(
    tokenAddresses,
    activeWallet?.address
  );

  // Calculate balances
  const { stablecoinData, totalStablecoinUSD, otherTokens, filteredOtherTokens } = useMemo(() => {
    let totalStablecoinUSD = 0;
    const stablecoinData: StablecoinData[] = [];

    if (balances) {
      stablecoins.forEach((token) => {
        const balance = balances[token.address];
        if (!balance) return;

        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);

        totalStablecoinUSD += valueUSD;

        stablecoinData.push({
          symbol: token.symbol,
          name: token.name,
          icon: token.icon,
          balance: formattedBalance,
          valueUSD,
          contractAddress: token.address,
          isMainstream: true,
        });
      });

      // Calculate percentage for each stablecoin
      stablecoinData.forEach(coin => {
        coin.percentage = totalStablecoinUSD > 0
          ? (coin.valueUSD / totalStablecoinUSD) * 100
          : 0;
      });
    }

    // Get other tokens
    const otherTokens = allTokens
      .filter(t => t.symbol !== 'USDT' && t.symbol !== 'USDC')
      .map(token => {
        const balance = balances?.[token.address];
        if (!balance) return null;

        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);

        if (parseFloat(formattedBalance) <= 0.0001) return null;

        // Mock 24h change
        const mockChanges: Record<string, number> = {
          ETH: 2.34,
          WBTC: 1.56,
        };

        return {
          symbol: token.symbol,
          name: token.name,
          balance: formattedBalance,
          valueUSD,
          icon: token.icon,
          change24h: mockChanges[token.symbol] || 0,
          contractAddress: token.address,
        };
      })
      .filter(Boolean) as Array<{
        symbol: string;
        name: string;
        balance: string;
        valueUSD: number;
        icon: string;
        change24h: number;
        contractAddress: string;
      }>;

    // Filter by search query
    const filteredOtherTokens = otherTokens.filter(token =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort tokens
    filteredOtherTokens.sort((a, b) => {
      switch (sortBy) {
        case 'value-desc':
          return b.valueUSD - a.valueUSD;
        case 'value-asc':
          return a.valueUSD - b.valueUSD;
        case 'name-asc':
          return a.symbol.localeCompare(b.symbol);
        case 'balance-desc':
          return parseFloat(b.balance) - parseFloat(a.balance);
        default:
          return 0;
      }
    });

    return {
      stablecoinData,
      totalStablecoinUSD,
      otherTokens,
      filteredOtherTokens,
    };
  }, [balances, stablecoins, allTokens, searchQuery, sortBy]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("餘額已更新");
    } catch {
      toast.error("更新失敗");
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>全部資產</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-9 w-9 p-0"
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Search & Sort Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-keylio-text-muted" />
              <Input
                placeholder="搜尋資產..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-keylio-bg-primary border-keylio-border-primary"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const options: SortOption[] = ['value-desc', 'value-asc', 'name-asc', 'balance-desc'];
                const currentIndex = options.indexOf(sortBy);
                setSortBy(options[(currentIndex + 1) % options.length]);
              }}
              className="shrink-0 border-keylio-border-primary hover:bg-keylio-bg-tertiary"
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              {sortBy === 'value-desc' && '價值↓'}
              {sortBy === 'value-asc' && '價值↑'}
              {sortBy === 'name-asc' && '名稱'}
              {sortBy === 'balance-desc' && '數量↓'}
            </Button>
          </div>

          {/* Main Stablecoin Section */}
          <div className="bg-linear-to-br from-keylio-bg-tertiary to-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-5 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-teal-500/5 to-transparent pointer-events-none" />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-keylio-text-secondary">
                  穩定幣總餘額
                </div>
                <div className="flex items-center gap-1 text-xs text-keylio-text-muted">
                  <span className="w-2 h-2 rounded-full bg-keylio-teal" />
                  {ACTIVE_CHAIN.displayName}
                </div>
              </div>

              {isLoading ? (
                <Skeleton className="h-12 w-48 bg-keylio-bg-tertiary" />
              ) : error ? (
                <div className="text-red-400 text-2xl font-bold">連接失敗</div>
              ) : totalStablecoinUSD === 0 ? (
                <div className="py-4">
                  <EmptyState
                    icon="💰"
                    title="尚未持有穩定幣"
                    description="開始接收 USDT 或 USDC"
                    size="sm"
                    action={
                      <ReceiveDialog
                        address={activeWallet?.address || ""}
                        trigger={
                          <Button
                            size="sm"
                            className="bg-keylio-teal hover:bg-keylio-teal/90 text-white"
                          >
                            <ArrowDownToLine className="w-4 h-4 mr-1.5" />
                            立即接收
                          </Button>
                        }
                      />
                    }
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-teal-400 to-teal-300 mb-4">
                    {hideBalances ? "••••••" : formatUSD(totalStablecoinUSD)}
                  </h2>

                  {/* Stablecoin List using StablecoinRow */}
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-2"
                  >
                    {stablecoinData.map((coin) => (
                      <StablecoinRow
                        key={coin.symbol}
                        coin={coin}
                        variant="detailed"
                        hideBalance={hideBalances}
                      />
                    ))}
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Other Assets - Collapsible */}
          {otherTokens.length > 0 && (
            <div className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary overflow-hidden">
              <button
                onClick={() => setShowOtherAssets(!showOtherAssets)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-keylio-bg-tertiary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-keylio-text-secondary">
                    其他資產
                  </span>
                  <span className="text-xs text-keylio-text-muted bg-keylio-bg-tertiary px-2 py-0.5 rounded-full">
                    {filteredOtherTokens.length}/{otherTokens.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-keylio-text-primary">
                    {hideBalances ? "••••" : formatUSD(filteredOtherTokens.reduce((sum, t) => sum + t.valueUSD, 0))}
                  </span>
                  {showOtherAssets ? (
                    <ChevronUp className="w-4 h-4 text-keylio-text-secondary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-keylio-text-secondary" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {showOtherAssets ? <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="px-4 pb-4 space-y-2"
                    >
                      {filteredOtherTokens.length === 0 && searchQuery ? (
                        <div className="py-6 text-center text-sm text-keylio-text-muted">
                          找不到「{searchQuery}」相關的資產
                        </div>
                      ) : (
                        filteredOtherTokens.map((token) => (
                          <OtherAssetItem
                            key={token.symbol}
                            token={token}
                            hideBalance={hideBalances}
                          />
                        ))
                      )}
                    </motion.div>
                  </motion.div> : null}
              </AnimatePresence>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** 其他資產項目 */
interface OtherAssetItemProps {
  token: {
    symbol: string;
    name: string;
    balance: string;
    valueUSD: number;
    icon: string;
    change24h: number;
  };
  hideBalance?: boolean;
}

function OtherAssetItem({ token, hideBalance }: OtherAssetItemProps) {
  const hasChange = token.change24h !== 0;
  const isPositive = token.change24h > 0;
  const isNegative = token.change24h < 0;

  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center justify-between p-3 bg-keylio-bg-tertiary/50 rounded-xl"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{token.icon}</span>
        <div>
          <div className="font-medium text-keylio-text-primary flex items-center gap-2">
            {token.symbol}
            {hasChange ? <span
                className={cn(
                  "text-xs flex items-center gap-0.5",
                  isPositive && "text-green-400",
                  isNegative && "text-red-400",
                  !isPositive && !isNegative && "text-keylio-text-muted"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isNegative ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {formatPercent(Math.abs(token.change24h), { showSign: false })}
              </span> : null}
          </div>
          <div className="text-xs text-keylio-text-muted">
            {hideBalance ? "••••" : formatTokenBalance(token.balance)} {token.symbol}
          </div>
        </div>
      </div>
      <div className="text-right font-medium text-keylio-text-primary">
        {hideBalance ? "••••" : formatCurrency(token.valueUSD)}
      </div>
    </motion.div>
  );
}

export const AssetDetailDialog = memo(AssetDetailDialogComponent);
