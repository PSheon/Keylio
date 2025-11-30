"use client";

import { useState, useMemo, memo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Check,
  Clock,
  X,
  Calendar,
  Wallet,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  ResponsiveSheet,
  ResponsiveSheetTrigger,
  ResponsiveSheetContent,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetBody,
} from "@/components/ui/responsive-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { formatCurrency, formatDateTime, shortenAddress } from "@/lib/formatters";
import db from "@/lib/storage/db";
import type { Transaction } from "@/lib/storage/db";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/stores/useWalletStore";
import { TransactionDetailDialog } from "./TransactionDetailDialog";

interface AllTransactionsDialogProps {
  /** 觸發器元素 */
  trigger: React.ReactNode;
}

/** 篩選類型 */
type FilterType = "all" | "receive" | "send" | "swap";

/** 時間範圍 */
type DateRange = "all" | "7d" | "30d" | "90d";

/** 金額範圍 */
type AmountRange = "all" | "small" | "medium" | "large";

/**
 * 所有交易紀錄 Dialog
 *
 * 功能：
 * - 篩選條：類型（全部/收款/支出/兌換）、日期範圍、金額範圍
 * - 搜尋框：地址/Tx hash
 * - 列表：方向、對象、金額、日期時間、狀態
 * - 點擊開啟 TransactionDetailDialog
 */
function AllTransactionsDialogComponent({ trigger }: AllTransactionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [amountRange, setAmountRange] = useState<AmountRange>("all");

  // 交易詳情 Dialog 狀態
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 獲取錢包資訊
  const { wallets, activeWalletId } = useWalletStore(
    useShallow((state) => ({
      wallets: state.wallets,
      activeWalletId: state.activeWalletId,
    }))
  );

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );

  // 計算日期範圍（毫秒偏移量，不依賴 Date.now()）
  const dateOffsetMs = useMemo(() => {
    switch (dateRange) {
      case "7d":
        return 7 * 24 * 60 * 60 * 1000;
      case "30d":
        return 30 * 24 * 60 * 60 * 1000;
      case "90d":
        return 90 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }, [dateRange]);

  // 從 IndexedDB 獲取交易記錄
  const allTransactions = useLiveQuery(
    () => {
      if (!activeWallet?.id) return [];
      return db.transactions
        .where("subWalletId")
        .equals(activeWallet.id)
        .reverse()
        .sortBy("timestamp");
    },
    [activeWallet?.id]
  );

  // 篩選交易 - 使用 callback 來避免在 useMemo 中調用 Date.now()
  const filterTransactions = useCallback((transactions: Transaction[], wallet: typeof activeWallet) => {
    if (!transactions || !wallet) return [];

    const now = Date.now();
    const dateThreshold = dateOffsetMs > 0 ? now - dateOffsetMs : 0;

    return transactions.filter((tx) => {
      // 搜尋篩選
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchHash = tx.hash.toLowerCase().includes(query);
        const matchFrom = tx.from.toLowerCase().includes(query);
        const matchTo = tx.to.toLowerCase().includes(query);
        if (!matchHash && !matchFrom && !matchTo) return false;
      }

      // 類型篩選
      if (filterType !== "all") {
        const isIncoming = tx.to.toLowerCase() === wallet.address.toLowerCase();
        if (filterType === "receive" && !isIncoming) return false;
        if (filterType === "send" && isIncoming) return false;
      }

      // 日期篩選
      if (dateThreshold > 0 && tx.timestamp < dateThreshold) return false;

      // 金額篩選
      const amount = parseFloat(tx.amount);
      if (amountRange === "small" && amount > 100) return false;
      if (amountRange === "medium" && (amount <= 100 || amount > 1000)) return false;
      if (amountRange === "large" && amount <= 1000) return false;

      return true;
    });
  }, [searchQuery, filterType, dateOffsetMs, amountRange]);

  const filteredTransactions = filterTransactions(allTransactions || [], activeWallet);

  // 開啟交易詳情
  const handleTxClick = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  }, []);

  // 日期範圍文字
  const dateRangeLabel = useMemo(() => {
    switch (dateRange) {
      case "7d":
        return "最近 7 天";
      case "30d":
        return "最近 30 天";
      case "90d":
        return "最近 90 天";
      default:
        return "全部時間";
    }
  }, [dateRange]);

  const isLoading = allTransactions === undefined;

  return (
    <>
      <ResponsiveSheet open={open} onOpenChange={setOpen}>
        <ResponsiveSheetTrigger asChild>{trigger}</ResponsiveSheetTrigger>
        <ResponsiveSheetContent size="lg" className="max-h-[85vh]">
          <ResponsiveSheetHeader>
            <div className="flex items-center justify-between">
              <div>
                <ResponsiveSheetTitle>所有交易紀錄</ResponsiveSheetTitle>
                <p className="text-sm text-keylio-text-muted mt-1 flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  {activeWallet?.name || "我的錢包"} · {dateRangeLabel}
                </p>
              </div>
            </div>
          </ResponsiveSheetHeader>

          <ResponsiveSheetBody className="space-y-4">
            {/* 搜尋與篩選區 */}
            <div className="space-y-3">
              {/* 搜尋框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-keylio-text-muted" />
                <Input
                  placeholder="搜尋地址或交易雜湊..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-keylio-bg-primary border-keylio-border-primary"
                />
              </div>

              {/* 篩選按鈕列 */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* 類型篩選 */}
                <Select
                  value={filterType}
                  onValueChange={(v) => setFilterType(v as FilterType)}
                >
                  <SelectTrigger className="w-[120px] h-9 bg-keylio-bg-tertiary border-keylio-border-primary text-sm">
                    <SelectValue placeholder="全部類型" />
                  </SelectTrigger>
                  <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
                    <SelectItem value="all">全部類型</SelectItem>
                    <SelectItem value="receive">收款</SelectItem>
                    <SelectItem value="send">支出</SelectItem>
                    <SelectItem value="swap">兌換</SelectItem>
                  </SelectContent>
                </Select>

                {/* 日期範圍 */}
                <Select
                  value={dateRange}
                  onValueChange={(v) => setDateRange(v as DateRange)}
                >
                  <SelectTrigger className="w-[120px] h-9 bg-keylio-bg-tertiary border-keylio-border-primary text-sm">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    <SelectValue placeholder="時間範圍" />
                  </SelectTrigger>
                  <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
                    <SelectItem value="7d">最近 7 天</SelectItem>
                    <SelectItem value="30d">最近 30 天</SelectItem>
                    <SelectItem value="90d">最近 90 天</SelectItem>
                    <SelectItem value="all">全部時間</SelectItem>
                  </SelectContent>
                </Select>

                {/* 金額範圍 */}
                <Select
                  value={amountRange}
                  onValueChange={(v) => setAmountRange(v as AmountRange)}
                >
                  <SelectTrigger className="w-[120px] h-9 bg-keylio-bg-tertiary border-keylio-border-primary text-sm">
                    <SelectValue placeholder="金額範圍" />
                  </SelectTrigger>
                  <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
                    <SelectItem value="all">全部金額</SelectItem>
                    <SelectItem value="small">≤ $100</SelectItem>
                    <SelectItem value="medium">$100 - $1,000</SelectItem>
                    <SelectItem value="large">&gt; $1,000</SelectItem>
                  </SelectContent>
                </Select>

                {/* 統計 */}
                <div className="ml-auto text-xs text-keylio-text-muted">
                  共 {filteredTransactions.length} 筆
                </div>
              </div>
            </div>

            {/* 交易列表 */}
            <div className="bg-keylio-bg-secondary sm:rounded-xl sm:border border-keylio-border-primary overflow-hidden -mx-4 sm:mx-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={searchQuery ? "🔍" : "📭"}
                    title={searchQuery ? "找不到符合的交易" : "尚無交易紀錄"}
                    description={
                      searchQuery
                        ? "請嘗試其他搜尋條件"
                        : "完成第一筆交易後，紀錄將顯示在這裡"
                    }
                    size="md"
                  />
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="divide-y divide-keylio-border-primary max-h-[50vh] sm:max-h-[400px] overflow-y-auto"
                >
                  {filteredTransactions.map((tx) => (
                    <TransactionListItem
                      key={tx.id || tx.hash}
                      transaction={tx}
                      walletAddress={activeWallet?.address || ""}
                      onClick={() => handleTxClick(tx)}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </ResponsiveSheetBody>
        </ResponsiveSheetContent>
      </ResponsiveSheet>

      {/* 交易詳情 Dialog */}
      <TransactionDetailDialog
        transaction={selectedTx}
        walletAddress={activeWallet?.address || ""}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

/** 交易列表項目 */
interface TransactionListItemProps {
  transaction: Transaction;
  walletAddress: string;
  onClick: () => void;
}

const TransactionListItem = memo(function TransactionListItem({
  transaction: tx,
  walletAddress,
  onClick,
}: TransactionListItemProps) {
  const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
  // TODO: 根據 tx.type 判斷 swap
  const isSwap = false;
  const amount = parseFloat(tx.amount);

  // 圖標與樣式
  const getIcon = () => {
    if (isSwap) {
      return (
        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-purple-400" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isIncoming ? "bg-green-500/10" : "bg-red-500/10"
        )}
      >
        {isIncoming ? (
          <ArrowDownLeft className="w-5 h-5 text-green-400" />
        ) : (
          <ArrowUpRight className="w-5 h-5 text-red-400" />
        )}
      </div>
    );
  };

  // 狀態圖標
  const getStatusIcon = () => {
    switch (tx.status) {
      case "confirmed":
        return <Check className="w-3 h-3 text-green-400" />;
      case "pending":
        return <Clock className="w-3 h-3 text-amber-400" />;
      case "failed":
        return <X className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  const counterparty = isIncoming ? tx.from : tx.to;

  return (
    <motion.button
      variants={staggerItem}
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-keylio-bg-tertiary/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {getIcon()}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-keylio-text-primary text-sm">
              {isSwap ? "兌換" : isIncoming ? "收款" : "支出"}
            </span>
            <span className="text-xs text-keylio-text-muted font-mono">
              {shortenAddress(counterparty, { startChars: 4, endChars: 4 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-keylio-text-muted mt-0.5">
            <span>{formatDateTime(tx.timestamp)}</span>
            {getStatusIcon()}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-3">
        <div
          className={cn(
            "font-semibold text-sm",
            isIncoming ? "text-green-400" : "text-keylio-text-primary"
          )}
        >
          {isIncoming ? "+" : "-"}
          {amount.toFixed(2)} {tx.token}
        </div>
        <div className="text-xs text-keylio-text-muted">
          {formatCurrency(amount)}
        </div>
      </div>
    </motion.button>
  );
});

export const AllTransactionsDialog = memo(AllTransactionsDialogComponent);
