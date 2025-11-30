"use client";

import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ListFilter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Check,
  Clock,
  X,
  ArrowDownToLine,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiveDialog } from "@/components/transaction/ReceiveDialog";
import { AllTransactionsDialog } from "@/components/transaction/AllTransactionsDialog";
import { TransactionDetailDialog } from "@/components/transaction/TransactionDetailDialog";
import { fadeInUp } from "@/lib/animations";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/storage/db";

interface RecentActivityListProps {
  /** 交易列表 */
  transactions: Transaction[] | undefined;
  /** 當前錢包地址 */
  walletAddress: string;
}

/**
 * 近期活動列表
 * Spec: 顯示 5 筆最近交易
 * 設計：參考穩定幣資產卡片，標題與 CTA 在卡片內部
 */
function RecentActivityListComponent({
  transactions,
  walletAddress,
}: RecentActivityListProps) {
  const isEmpty = !transactions || transactions.length === 0;
  
  // 交易詳情 Dialog 狀態
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleTxClick = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    setDetailOpen(true);
  }, []);

  return (
    <>
      <motion.div 
        variants={fadeInUp}
        className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary overflow-hidden"
      >
        {/* Header - 卡片內部 */}
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-keylio-text-primary">
              近期活動
            </h3>
            <AllTransactionsDialog
              trigger={
                <button className="flex items-center gap-1 px-2 py-1 text-xs text-keylio-text-secondary hover:text-keylio-teal hover:bg-keylio-teal/10 rounded-lg transition-colors">
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>查看全部</span>
                </button>
              }
            />
          </div>
        </div>

        {/* Content */}
        {isEmpty ? (
          /* 空狀態 */
          <div className="px-5 pb-5">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-keylio-bg-tertiary flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-keylio-text-muted" />
              </div>
              <p className="text-keylio-text-secondary font-medium mb-1">
                尚無交易紀錄
              </p>
              <p className="text-sm text-keylio-text-muted mb-4">
                開始接收代幣或付款給朋友
              </p>
              <ReceiveDialog
                address={walletAddress}
                trigger={
                  <Button className="bg-keylio-teal hover:bg-keylio-teal/90 text-white">
                    <ArrowDownToLine className="w-4 h-4 mr-1.5" />
                    立即收款
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          /* 交易列表 */
          <div className="border-t border-keylio-border-primary">
            <div className="divide-y divide-keylio-border-primary">
              {transactions.map((tx) => (
                <TransactionItem
                  key={tx.id || tx.hash}
                  transaction={tx}
                  walletAddress={walletAddress}
                  onClick={() => handleTxClick(tx)}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* 交易詳情 Dialog */}
      <TransactionDetailDialog
        transaction={selectedTx}
        walletAddress={walletAddress}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
  walletAddress: string;
  onClick: () => void;
}

function TransactionItem({
  transaction: tx,
  walletAddress,
  onClick,
}: TransactionItemProps) {
  const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
  const isSwap = false; // TODO: Add type field to Transaction schema

  // Icon and styling based on transaction type
  const getIcon = () => {
    if (isSwap) return <ArrowRightLeft className="w-4 h-4" />;
    return isIncoming ? (
      <ArrowDownLeft className="w-4 h-4" />
    ) : (
      <ArrowUpRight className="w-4 h-4" />
    );
  };

  const getIconStyles = () => {
    if (isSwap) return "bg-purple-500/10 text-purple-400";
    return isIncoming
      ? "bg-green-500/10 text-green-400"
      : "bg-red-500/10 text-red-400";
  };

  // Render status icon based on transaction status
  const renderStatusIcon = () => {
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

  const amount = parseFloat(tx.amount);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 hover:bg-keylio-bg-tertiary transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            getIconStyles()
          )}
        >
          {getIcon()}
        </div>
        <div className="text-left">
          <div className="font-medium text-keylio-text-primary text-sm">
            {isSwap
              ? `${tx.token}→USDT`
              : `${isIncoming ? "+" : "-"}${tx.token} ${amount.toFixed(2)}`}
          </div>
          <div className="text-xs text-keylio-text-muted flex items-center gap-1">
            {formatRelativeTime(tx.timestamp)} {renderStatusIcon()}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={cn(
            "font-semibold text-sm",
            isIncoming ? "text-green-400" : "text-keylio-text-primary"
          )}
        >
          {isIncoming ? "+" : "-"}
          {formatCurrency(amount)}
        </div>
      </div>
    </button>
  );
}

export const RecentActivityList = memo(RecentActivityListComponent);
