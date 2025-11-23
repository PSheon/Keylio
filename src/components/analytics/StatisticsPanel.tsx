"use client";

import { useState, useMemo, memo } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, ArrowUpDown, Users, Calendar } from "lucide-react";
import { useWalletStore } from "@/stores/useWalletStore";
import { formatUSD } from "@/lib/tokens";
import db from "@/lib/storage/db";
import { useLiveQuery } from "dexie-react-hooks";

type TimeRange = '7d' | '30d' | 'all';

export function StatisticsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [currentTime] = useState(() => Date.now());
  
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  
  // Get active wallet
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  
  // Fetch transactions from database
  const transactions = useLiveQuery(
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

  // Calculate statistics based on time range
  const statistics = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        monthlyIncome: 0,
        monthlyExpense: 0,
        netFlow: 0,
        transactionCount: 0,
        averageTransaction: 0,
        topContact: null as { name: string; count: number } | null,
      };
    }

    // Filter by time range
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    }[timeRange];

    const filteredTxs = transactions.filter(
      tx => currentTime - tx.timestamp <= timeRangeMs
    );

    // Calculate income and expense
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const contactCounts = new Map<string, number>();

    filteredTxs.forEach((tx) => {
      const amount = parseFloat(tx.amount);
      
      // Determine transaction type based on wallet address
      const isIncoming = activeWallet && tx.to.toLowerCase() === activeWallet.address.toLowerCase();
      
      if (isIncoming) {
        monthlyIncome += amount;
        // Track sender
        if (tx.from) {
          contactCounts.set(tx.from, (contactCounts.get(tx.from) || 0) + 1);
        }
      } else {
        monthlyExpense += amount;
        // Track receiver
        if (tx.to) {
          contactCounts.set(tx.to, (contactCounts.get(tx.to) || 0) + 1);
        }
      }
    });

    const netFlow = monthlyIncome - monthlyExpense;
    const transactionCount = filteredTxs.length;
    const averageTransaction = transactionCount > 0 
      ? (monthlyIncome + monthlyExpense) / transactionCount 
      : 0;

    // Find top contact
    let topContact: { name: string; count: number } | null = null;
    if (contactCounts.size > 0) {
      const [address, count] = Array.from(contactCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];
      topContact = {
        name: `${address.slice(0, 6)}...${address.slice(-4)}`,
        count,
      };
    }

    return {
      monthlyIncome,
      monthlyExpense,
      netFlow,
      transactionCount,
      averageTransaction,
      topContact,
    };
  }, [transactions, timeRange, currentTime, activeWallet]);

  const timeRangeLabels: Record<TimeRange, string> = {
    '7d': '最近 7 天',
    '30d': '最近 30 天',
    'all': '全部',
  };

  return (
    <Card className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-keylio-bg-tertiary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-teal-400" />
          <CardTitle className="text-base font-semibold">帳戶統計</CardTitle>
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && (
            <div className="text-sm text-keylio-text-secondary">
              {statistics.transactionCount} 筆交易
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-keylio-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-keylio-text-secondary" />
          )}
        </div>
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-6 space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-keylio-text-secondary" />
            <div className="flex gap-2">
              {(['7d', '30d', 'all'] as TimeRange[]).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className={
                    timeRange === range
                      ? 'bg-keylio-teal hover:bg-keylio-teal/90 text-white border-0'
                      : 'border-keylio-border-primary hover:bg-keylio-bg-tertiary text-keylio-text-secondary'
                  }
                >
                  {timeRangeLabels[range]}
                </Button>
              ))}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Income */}
            <div className="bg-keylio-bg-primary/50 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-keylio-text-secondary">收入</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatUSD(statistics.monthlyIncome)}
              </p>
            </div>

            {/* Expense */}
            <div className="bg-keylio-bg-primary/50 rounded-xl p-4 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-sm text-keylio-text-secondary">支出</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {formatUSD(statistics.monthlyExpense)}
              </p>
            </div>
          </div>

          {/* Net Flow */}
          <div className="bg-keylio-bg-tertiary/50 rounded-xl p-4 border border-keylio-border-primary">
            <div className="flex items-center justify-between">
              <span className="text-sm text-keylio-text-secondary">淨流入</span>
              <div className="flex items-center gap-2">
                {statistics.netFlow >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xl font-bold ${
                  statistics.netFlow >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {statistics.netFlow >= 0 ? '+' : ''}{formatUSD(Math.abs(statistics.netFlow))}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-3 pt-2 border-t border-keylio-border-primary/50">
            <h4 className="text-sm font-semibold text-keylio-text-secondary">交易統計</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-keylio-text-secondary">交易次數:</span>
                <span className="font-medium">{statistics.transactionCount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-keylio-text-secondary">平均金額:</span>
                <span className="font-medium">{formatUSD(statistics.averageTransaction)}</span>
              </div>
            </div>

            {statistics.topContact && (
              <div className="flex items-center justify-between bg-keylio-bg-primary/50 rounded-lg p-3 border border-keylio-border-primary">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-keylio-text-secondary">最多交易對象:</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium font-mono">{statistics.topContact.name}</div>
                  <div className="text-xs text-keylio-text-muted">{statistics.topContact.count} 筆交易</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default memo(StatisticsPanel);
