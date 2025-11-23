"use client";

import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Clock, Loader2, ArrowRight } from "lucide-react";
import { useWalletStore } from "@/stores/useWalletStore";
import db from "@/lib/storage/db";
import { useLiveQuery } from "dexie-react-hooks";
import { formatUSD } from "@/lib/tokens";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem, fadeIn } from "@/lib/animations";

const ITEMS_PER_PAGE = 10;

export function TransactionHistory() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  
  // Get active wallet
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  
  // Fetch all transactions for the active wallet
  const allTransactions = useLiveQuery(
    () => {
      if (!activeWallet?.id) return [];
      return db.transactions
        .where('subWalletId')
        .equals(activeWallet.id)
        .reverse()
        .sortBy('timestamp');
    },
    [activeWallet?.id]
  );

  // Calculate visible transactions based on page
  const visibleTransactions = allTransactions?.slice(0, page * ITEMS_PER_PAGE) || [];
  const hasMore = (allTransactions?.length || 0) > visibleTransactions.length;

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setPage(prev => prev + 1);
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const handleTransactionClick = (txHash: string) => {
    // Navigate to transaction detail page (to be implemented)
    router.push(`/transactions?hash=${txHash}`);
  };

  if (!allTransactions || allTransactions.length === 0) {
    return (
      <div className="bg-keylio-bg-secondary rounded-xl border border-keylio-border-primary p-12 text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-keylio-text-secondary opacity-50" />
        <p className="text-keylio-text-secondary">尚無交易記錄</p>
        <p className="text-xs text-keylio-text-muted mt-2">開始使用錢包進行轉帳吧！</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-keylio-bg-secondary rounded-xl border border-keylio-border-primary overflow-hidden"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      <div className="divide-y divide-keylio-border-primary">
        <AnimatePresence mode="popLayout">
          {visibleTransactions.map((tx) => {
          const isIncoming = activeWallet && tx.to.toLowerCase() === activeWallet.address.toLowerCase();
          const amount = parseFloat(tx.amount);
          const timestamp = new Date(tx.timestamp).toLocaleString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <motion.button
              key={tx.id || tx.hash}
              variants={staggerItem}
              layout
              onClick={() => handleTransactionClick(tx.hash)}
              className="w-full min-h-11 p-4 flex items-center justify-between hover:bg-keylio-bg-tertiary/50 active:bg-keylio-bg-tertiary transition-colors text-left touch-manipulation"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isIncoming ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {isIncoming ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-keylio-text-primary truncate">
                    {isIncoming ? '收到' : '發送'} {tx.token}
                  </div>
                  <div className="text-xs text-keylio-text-secondary flex items-center gap-1">
                    <Clock size={10} />
                    {timestamp}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className={`font-bold ${
                    isIncoming ? 'text-green-400' : 'text-keylio-text-primary'
                  }`}>
                    {isIncoming ? '+' : '-'}{formatUSD(amount)}
                  </div>
                  <div className="text-xs text-keylio-text-muted capitalize">
                    {tx.status}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-keylio-text-secondary" />
              </div>
            </motion.button>
          );
        })}
        </AnimatePresence>
      </div>

      {/* Infinite Scroll Trigger */}
      {hasMore && (
        <div ref={observerRef} className="p-4 flex items-center justify-center border-t border-keylio-border-primary">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-keylio-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">加載更多...</span>
            </div>
          ) : (
            <div className="text-xs text-keylio-text-muted">
              向下滾動加載更多
            </div>
          )}
        </div>
      )}

      {/* No More Items */}
      {!hasMore && visibleTransactions.length > 0 && (
        <div className="p-4 text-center border-t border-keylio-border-primary">
          <p className="text-xs text-keylio-text-muted">已顯示全部 {allTransactions.length} 筆交易</p>
        </div>
      )}
    </motion.div>
  );
}

export default memo(TransactionHistory);
