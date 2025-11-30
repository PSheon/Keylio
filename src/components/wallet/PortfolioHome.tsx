"use client";

import { useState, useMemo, memo, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useShallow } from "zustand/react/shallow";
import { PageTransition, PageSection } from "@/components/ui/page-transition";
import { useMultiTokenBalance } from "@/hooks/useTokenBalance";
import { useTransactionSync } from "@/hooks/useTransactionSync";
import db from "@/lib/storage/db";
import { showSuccess, showError } from "@/lib/toast";
import { getAllTokens, formatTokenAmount, getTokenValueUSD } from "@/lib/tokens";
import { useWalletStore } from "@/stores/useWalletStore";
import { AssetCard } from "./AssetCard";
import { PortfolioHeader } from "./PortfolioHeader";
import { PortfolioOverview } from "./PortfolioOverview";
import { QuickActionGrid } from "./QuickActionGrid";
import { RecentActivityList } from "./RecentActivityList";

/**
 * Portfolio Home Page
 *
 * 頁面結構（優化後）：
 * 1. Header - 錢包切換
 * 2. Portfolio Overview - 總資產 + 趨勢圖表（整合）
 * 3. 快速操作 - 收款/發送/兌換
 * 4. 資產卡片 - Tab 切換（按幣種/按用途）
 * 5. 近期活動 - 最近 5 筆交易
 */
function PortfolioHomeComponent() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Optimized: Single selector with shallow comparison
  const { wallets, activeWalletId } = useWalletStore(
    useShallow((state) => ({
      wallets: state.wallets,
      activeWalletId: state.activeWalletId,
    }))
  );

  // Get active wallet
  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );
  const walletAddress = activeWallet?.address || "";

  // Transaction sync hook - auto polls for new transactions
  const { sync: syncTransactions } = useTransactionSync();

  // Get all tokens
  const allTokens = useMemo(() => getAllTokens(), []);
  const tokenAddresses = useMemo(
    () => allTokens.map((t) => t.address),
    [allTokens]
  );

  // Fetch balances
  const { data: balances, isLoading, error, refetch } = useMultiTokenBalance(
    tokenAddresses,
    walletAddress
  );

  // Spec: 近期活動 - 顯示 5 筆最近交易
  const recentTransactions = useLiveQuery(
    () => {
      if (!activeWallet?.id) return [];
      return db.transactions
        .where("subWalletId")
        .equals(activeWallet.id)
        .reverse()
        .limit(5)
        .sortBy("timestamp");
    },
    [activeWallet?.id]
  );

  // Calculate portfolio data
  const { totalValueUSD, hasBalance } = useMemo(() => {
    let totalValueUSD = 0;

    if (balances) {
      allTokens.forEach((token) => {
        const balance = balances[token.address];
        if (!balance) return;

        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);
        totalValueUSD += valueUSD;
      });
    }

    return {
      totalValueUSD,
      hasBalance: totalValueUSD > 0,
    };
  }, [balances, allTokens]);

  // Refresh handler - syncs both balances and transactions
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Parallel refresh: balance + transaction history
      await Promise.all([
        refetch(),
        syncTransactions(),
      ]);
      showSuccess("已更新");
    } catch {
      showError("更新失敗");
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, syncTransactions]);

  return (
    <PageTransition>
      {/* 1. Header with Wallet Switcher */}
      <PageSection>
        <PortfolioHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />
      </PageSection>

      {/* 2. Portfolio Overview - 整合總資產 + 趨勢圖表 */}
      <PageSection>
        <PortfolioOverview
          totalValueUSD={totalValueUSD}
          subWalletId={activeWallet?.id}
          isLoading={isLoading}
          hasError={!!error}
        />
      </PageSection>

      {/* 3. 快速操作 */}
      <PageSection>
        <QuickActionGrid walletAddress={walletAddress} hasBalance={hasBalance} />
      </PageSection>

      {/* 4. 資產卡片 - Tab 切換（按幣種/按用途）+ 完整資產入口 */}
      <PageSection>
        <AssetCard />
      </PageSection>

      {/* 5. 近期活動 */}
      <PageSection>
        <RecentActivityList
          transactions={recentTransactions}
          walletAddress={walletAddress}
        />
      </PageSection>
    </PageTransition>
  );
}

export const PortfolioHome = memo(PortfolioHomeComponent);
export default PortfolioHome;
