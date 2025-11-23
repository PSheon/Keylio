"use client";

import { useState, useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useWalletStore } from "@/stores/useWalletStore";
import { getAllTokens, formatTokenAmount, formatUSD, getTokenValueUSD } from "@/lib/tokens";
import { useMultiTokenBalance } from "@/hooks/useTokenBalance";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";

export function AssetOverview() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  
  // Get active wallet
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  
  // Get stablecoins only (USDT, USDC)
  const allTokens = useMemo(() => getAllTokens(), []);
  const stablecoins = useMemo(() => 
    allTokens.filter(t => t.symbol === 'USDT' || t.symbol === 'USDC'),
    [allTokens]
  );
  const tokenAddresses = useMemo(() => stablecoins.map(t => t.address), [stablecoins]);
  
  // Fetch balances for stablecoins
  const { data: balances, isLoading, error, refetch } = useMultiTokenBalance(
    tokenAddresses,
    activeWallet?.address
  );
  
  // Calculate stablecoin balances
  const { usdtBalance, usdcBalance, totalStablecoinUSD, otherTokens } = useMemo(() => {
    let usdtBalance = 0;
    let usdcBalance = 0;
    let totalStablecoinUSD = 0;
    
    if (balances) {
      stablecoins.forEach((token) => {
        const balance = balances[token.address];
        if (!balance) return;
        
        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);
        
        if (token.symbol === 'USDT') {
          usdtBalance = valueUSD;
        } else if (token.symbol === 'USDC') {
          usdcBalance = valueUSD;
        }
        
        totalStablecoinUSD += valueUSD;
      });
    }
    
    // Get other tokens for detail view
    const otherTokens = allTokens
      .filter(t => t.symbol !== 'USDT' && t.symbol !== 'USDC')
      .map(token => {
        const balance = balances?.[token.address];
        if (!balance) return null;
        
        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);
        
        if (parseFloat(formattedBalance) <= 0.0001) return null;
        
        return {
          symbol: token.symbol,
          name: token.name,
          balance: formattedBalance,
          valueUSD,
          icon: token.icon,
        };
      })
      .filter(Boolean) as Array<{
        symbol: string;
        name: string;
        balance: string;
        valueUSD: number;
        icon: string;
      }>;
    
    return {
      usdtBalance,
      usdcBalance,
      totalStablecoinUSD,
      otherTokens,
    };
  }, [balances, stablecoins, allTokens]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("餘額已更新");
    } catch (error) {
      toast.error("更新失敗");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Main Balance - 80% Above the Fold */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-linear-to-br from-keylio-bg-secondary to-keylio-bg-tertiary border-keylio-border-primary text-keylio-text-primary overflow-hidden relative">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-teal-500/5 to-transparent pointer-events-none" />
        
        <CardContent className="pt-8 pb-6 relative">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm font-medium text-keylio-text-secondary">
              穩定幣總餘額
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="min-h-11 min-w-11 h-11 w-11 p-0 hover:bg-keylio-bg-tertiary touch-manipulation active:scale-95 transition-transform"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-16 w-64 bg-keylio-bg-tertiary mb-4" />
          ) : error ? (
            <div className="text-red-400 text-2xl font-bold mb-4">連接失敗</div>
          ) : (
            <>
              {/* Main Balance - Extra Large */}
              <div className="mb-6">
                <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-teal-400 to-teal-300">
                  {formatUSD(totalStablecoinUSD)}
                </h2>
                <p className="text-sm text-keylio-text-secondary mt-2">
                  USDT + USDC 合計
                </p>
              </div>

              {/* Stablecoin Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-keylio-bg-primary/50 rounded-xl p-4 border border-keylio-border-primary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💵</span>
                    <span className="font-semibold text-keylio-text-primary">USDT</span>
                  </div>
                  <p className="text-2xl font-bold text-keylio-text-primary">
                    {formatUSD(usdtBalance)}
                  </p>
                </div>
                
                <div className="bg-keylio-bg-primary/50 rounded-xl p-4 border border-keylio-border-primary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💎</span>
                    <span className="font-semibold text-keylio-text-primary">USDC</span>
                  </div>
                  <p className="text-2xl font-bold text-keylio-text-primary">
                    {formatUSD(usdcBalance)}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Other Assets - Collapsible (20% Below the Fold) */}
      {otherTokens.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full min-h-11 px-6 py-4 flex items-center justify-between hover:bg-keylio-bg-tertiary/50 active:bg-keylio-bg-tertiary transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-keylio-text-secondary">
                其他資產
              </span>
              <span className="text-xs text-keylio-text-muted bg-keylio-bg-tertiary px-2 py-0.5 rounded-full">
                {otherTokens.length}
              </span>
            </div>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-keylio-text-secondary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-keylio-text-secondary" />
            )}
          </button>
          
          {showDetails && (
            <CardContent className="pt-0 pb-4 space-y-3">
              {otherTokens.map((token) => (
                <motion.div 
                  key={token.symbol} 
                  variants={staggerItem}
                  className="flex items-center justify-between text-sm py-2 border-t border-keylio-border-primary/50 first:border-t-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{token.icon}</span>
                    <div>
                      <div className="font-medium text-keylio-text-primary">{token.symbol}</div>
                      <div className="text-xs text-keylio-text-muted">{parseFloat(token.balance).toFixed(4)}</div>
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    {formatUSD(token.valueUSD)}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          )}
        </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

export default memo(AssetOverview);
