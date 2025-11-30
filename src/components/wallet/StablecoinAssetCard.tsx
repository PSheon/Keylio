"use client";

import { useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { 
  ArrowDownToLine, 
  Wallet, 
  PiggyBank, 
  CreditCard,
  ChevronRight,
  Info,
  ListTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useWalletStore } from "@/stores/useWalletStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { getAllTokens, formatTokenAmount, getTokenValueUSD } from "@/lib/tokens";
import { formatUSD, formatTokenBalance } from "@/lib/formatters";
import { useMultiTokenBalance } from "@/hooks/useTokenBalance";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { ReceiveDialog } from "@/components/transaction/ReceiveDialog";
import { AssetDetailDialog } from "./AssetDetailDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogBody,
} from "@/components/ui/dialog";

/** TWD 匯率（實際應從 API 獲取） */
const USD_TO_TWD = 32.5;

/** 用途分類類型 */
type WalletPurpose = 'receiving' | 'spending' | 'savings';

/** 用途分類配置 */
const PURPOSE_CONFIG: Record<WalletPurpose, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}> = {
  receiving: {
    label: '收款用',
    icon: ArrowDownToLine,
    description: '用於接收款項的錢包',
    color: 'text-green-400',
  },
  spending: {
    label: '支出用',
    icon: CreditCard,
    description: '用於日常支出的錢包',
    color: 'text-blue-400',
  },
  savings: {
    label: '儲蓄',
    icon: PiggyBank,
    description: '用於長期儲蓄的錢包',
    color: 'text-amber-400',
  },
};

/** 幣種資料結構 */
interface CoinData {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
  valueUSD: number;
  percentage: number;
  contractAddress: string;
}

/** 用途分類資料結構 */
interface PurposeData {
  purpose: WalletPurpose;
  totalUSD: number;
  walletCount: number;
  coins: CoinData[];
}

/**
 * 穩定幣資產卡片
 * 
 * 設計重點：
 * 1. 標題「穩定幣資產」+ 右側「僅顯示穩定幣」標籤
 * 2. 穩定幣總額 + TWD 等值 + 持有數量資訊
 * 3. Tab 切換：按用途 / 按幣種
 * 4. 空狀態：顯示「尚未持有」+ 收款按鈕
 */
function StablecoinAssetCardComponent() {
  const [activeTab, setActiveTab] = useState<'purpose' | 'coin'>('coin');
  
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const hideBalancesSetting = useSettingsStore((state) => state.hideBalances);
  
  // 將設定轉換為 boolean
  const hideBalances = hideBalancesSetting === 'always-hide' || hideBalancesSetting === 'hide-on-start';
  
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  
  // Get stablecoin tokens
  const stablecoins = useMemo(() => 
    getAllTokens().filter(t => t.symbol === 'USDT' || t.symbol === 'USDC'),
    []
  );
  
  const tokenAddresses = useMemo(() => stablecoins.map(t => t.address), [stablecoins]);
  
  // Fetch balances
  const { data: balances, isLoading, error } = useMultiTokenBalance(
    tokenAddresses,
    activeWallet?.address
  );
  
  // Calculate coin data
  const { coinData, totalStablecoinUSD, totalTWD } = useMemo(() => {
    let totalStablecoinUSD = 0;
    const coinData: CoinData[] = [];
    
    if (balances) {
      stablecoins.forEach((token) => {
        const balance = balances[token.address];
        if (!balance) return;
        
        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);
        
        totalStablecoinUSD += valueUSD;
        
        coinData.push({
          symbol: token.symbol,
          name: token.name,
          icon: token.icon,
          balance: formattedBalance,
          valueUSD,
          percentage: 0, // 稍後計算
          contractAddress: token.address,
        });
      });
      
      // Calculate percentage for each coin
      coinData.forEach(coin => {
        coin.percentage = totalStablecoinUSD > 0 
          ? (coin.valueUSD / totalStablecoinUSD) * 100 
          : 0;
      });
    }
    
    return {
      coinData,
      totalStablecoinUSD,
      totalTWD: totalStablecoinUSD * USD_TO_TWD,
    };
  }, [balances, stablecoins]);
  
  // Mock purpose data (實際應從 DB 讀取子錢包分類)
  const purposeData: PurposeData[] = useMemo(() => {
    // 目前只有一個錢包，模擬分配到收款用途
    if (totalStablecoinUSD === 0) return [];
    
    return [
      {
        purpose: 'receiving',
        totalUSD: totalStablecoinUSD,
        walletCount: 1,
        coins: coinData,
      },
      // 未來擴展：
      // { purpose: 'spending', totalUSD: 0, walletCount: 0, coins: [] },
      // { purpose: 'savings', totalUSD: 0, walletCount: 0, coins: [] },
    ];
  }, [totalStablecoinUSD, coinData]);
  
  const coinCount = coinData.filter(c => c.valueUSD > 0).length;
  const isEmpty = totalStablecoinUSD === 0;

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 pb-4">
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-keylio-text-primary">
            穩定幣資產
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-keylio-bg-tertiary text-keylio-text-muted">
              僅顯示穩定幣
            </span>
            {/* 查看完整資產按鈕 - 深度檢視入口 */}
            <AssetDetailDialog
              trigger={
                <button
                  className="flex items-center gap-1 px-2 py-1 text-xs text-keylio-text-secondary hover:text-keylio-teal hover:bg-keylio-teal/10 rounded-lg transition-colors"
                >
                  <ListTree className="w-3.5 h-3.5" />
                  <span>完整資產</span>
                </button>
              }
            />
          </div>
        </div>
        
        {/* 主要資訊 */}
        {isLoading ? (
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32 bg-keylio-bg-tertiary" />
              <Skeleton className="h-4 w-40 bg-keylio-bg-tertiary" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-6 w-24 bg-keylio-bg-tertiary ml-auto" />
              <Skeleton className="h-4 w-32 bg-keylio-bg-tertiary ml-auto" />
            </div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-lg font-medium">連接失敗</div>
        ) : isEmpty ? null : (
          <div className="flex justify-between items-start">
            {/* 左側：穩定幣總額 */}
            <div>
              <div className="text-2xl font-bold text-keylio-text-primary">
                {hideBalances ? "••••••" : formatUSD(totalStablecoinUSD)}
              </div>
              <div className="text-sm text-keylio-text-muted mt-0.5">
                持有 {coinCount} 種穩定幣 · {wallets.length} 個子錢包
              </div>
            </div>
            
            {/* 右側：TWD 等值 */}
            <div className="text-right">
              <div className="text-lg font-medium text-keylio-text-secondary">
                {hideBalances 
                  ? "••••••" 
                  : `≈ NT$ ${totalTWD.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`
                }
              </div>
              <div className="text-xs text-keylio-text-muted mt-0.5 flex items-center justify-end gap-1">
                <span>以 USD 為基準換算</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 空狀態 */}
      {!isLoading && !error && isEmpty && (
        <div className="px-5 pb-5">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-keylio-bg-tertiary flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-keylio-text-muted" />
            </div>
            <p className="text-keylio-text-secondary font-medium mb-1">
              尚未持有任何穩定幣
            </p>
            <p className="text-sm text-keylio-text-muted mb-4">
              開始接收 USDT 或 USDC
            </p>
            <ReceiveDialog
              address={activeWallet?.address || ""}
              trigger={
                <Button
                  className="bg-keylio-teal hover:bg-keylio-teal/90 text-white"
                >
                  <ArrowDownToLine className="w-4 h-4 mr-1.5" />
                  立即收款
                </Button>
              }
            />
          </div>
        </div>
      )}
      
      {/* Tab 內容 */}
      {!isLoading && !error && !isEmpty && (
        <div className="border-t border-keylio-border-primary">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'purpose' | 'coin')}>
            <TabsList className="w-full justify-start px-5 py-2 bg-transparent border-b border-keylio-border-primary rounded-none h-auto">
              <TabsTrigger 
                value="coin"
                className="data-[state=active]:bg-keylio-teal/10 data-[state=active]:text-keylio-teal rounded-lg px-3 py-1.5 text-sm"
              >
                按幣種
              </TabsTrigger>
              <TabsTrigger 
                value="purpose"
                className="data-[state=active]:bg-keylio-teal/10 data-[state=active]:text-keylio-teal rounded-lg px-3 py-1.5 text-sm"
              >
                按用途
              </TabsTrigger>
            </TabsList>
            
            {/* 按幣種 Tab */}
            <TabsContent value="coin" className="mt-0">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-2"
              >
                {coinData.map((coin) => (
                  <CoinRow 
                    key={coin.symbol} 
                    coin={coin} 
                    hideBalance={hideBalances}
                  />
                ))}
              </motion.div>
            </TabsContent>
            
            {/* 按用途 Tab */}
            <TabsContent value="purpose" className="mt-0">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="p-4 space-y-2"
              >
                {purposeData.length > 0 ? (
                  purposeData.map((data) => (
                    <PurposeRow 
                      key={data.purpose} 
                      data={data}
                      hideBalance={hideBalances}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-sm text-keylio-text-muted">
                    尚未設定錢包用途分類
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </motion.div>
  );
}

/** 幣種列表項 */
interface CoinRowProps {
  coin: CoinData;
  hideBalance?: boolean;
}

function CoinRow({ coin, hideBalance }: CoinRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <motion.button
          variants={staggerItem}
          className="w-full flex items-center justify-between p-3 bg-keylio-bg-tertiary/50 hover:bg-keylio-bg-tertiary rounded-xl transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{coin.icon}</span>
            <div>
              <div className="font-medium text-keylio-text-primary">
                {coin.symbol}
              </div>
              <div className="text-xs text-keylio-text-muted">
                {hideBalance ? "••••" : formatTokenBalance(coin.balance)} {coin.symbol}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 佔比進度條 */}
            <div className="hidden sm:flex items-center gap-2 w-24">
              <Progress 
                value={coin.percentage} 
                className="h-1.5 bg-keylio-bg-primary"
              />
              <span className="text-xs text-keylio-text-muted w-10 text-right">
                {coin.percentage.toFixed(0)}%
              </span>
            </div>
            
            {/* USD 金額 */}
            <div className="text-right min-w-[80px]">
              <div className="font-medium text-keylio-text-primary">
                {hideBalance ? "••••" : formatUSD(coin.valueUSD)}
              </div>
            </div>
            
            <ChevronRight className="w-4 h-4 text-keylio-text-muted group-hover:text-keylio-teal transition-colors" />
          </div>
        </motion.button>
      </DialogTrigger>
      
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{coin.icon}</span>
            {coin.symbol} 明細
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="bg-keylio-bg-tertiary rounded-xl p-4">
            <div className="text-sm text-keylio-text-muted mb-1">持有數量</div>
            <div className="text-2xl font-bold text-keylio-text-primary">
              {hideBalance ? "••••••" : `${formatTokenBalance(coin.balance)} ${coin.symbol}`}
            </div>
            <div className="text-base text-keylio-text-secondary mt-1">
              {hideBalance ? "••••••" : `≈ ${formatUSD(coin.valueUSD)}`}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-keylio-text-muted">佔穩定幣資產</span>
              <span className="text-keylio-text-primary font-medium">{coin.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-keylio-text-muted">合約地址</span>
              <span className="text-keylio-text-primary font-mono text-xs">
                {coin.contractAddress.slice(0, 6)}...{coin.contractAddress.slice(-4)}
              </span>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** 用途分類列表項 */
interface PurposeRowProps {
  data: PurposeData;
  hideBalance?: boolean;
}

function PurposeRow({ data, hideBalance }: PurposeRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const config = PURPOSE_CONFIG[data.purpose];
  const Icon = config.icon;
  
  // 計算 TWD 等值
  const totalTWD = data.totalUSD * USD_TO_TWD;
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <motion.button
          variants={staggerItem}
          className="w-full flex items-center justify-between p-3 bg-keylio-bg-tertiary/50 hover:bg-keylio-bg-tertiary rounded-xl transition-colors group text-left"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-keylio-bg-primary"
            )}>
              <Icon className={cn("w-5 h-5", config.color)} />
            </div>
            <div>
              <div className="font-medium text-keylio-text-primary">
                {config.label}
              </div>
              <div className="text-xs text-keylio-text-muted">
                {data.walletCount} 個子錢包
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-medium text-keylio-text-primary">
                {hideBalance ? "••••" : formatUSD(data.totalUSD)}
              </div>
              <div className="text-xs text-keylio-text-muted">
                {hideBalance 
                  ? "••••" 
                  : `≈ NT$ ${totalTWD.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`
                }
              </div>
            </div>
            
            <ChevronRight className="w-4 h-4 text-keylio-text-muted group-hover:text-keylio-teal transition-colors" />
          </div>
        </motion.button>
      </DialogTrigger>
      
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-keylio-bg-tertiary"
            )}>
              <Icon className={cn("w-4 h-4", config.color)} />
            </div>
            {config.label}明細
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="bg-keylio-bg-tertiary rounded-xl p-4">
            <div className="text-sm text-keylio-text-muted mb-1">分類總額</div>
            <div className="text-2xl font-bold text-keylio-text-primary">
              {hideBalance ? "••••••" : formatUSD(data.totalUSD)}
            </div>
            <div className="text-base text-keylio-text-secondary mt-1">
              {hideBalance 
                ? "••••••" 
                : `≈ NT$ ${totalTWD.toLocaleString('zh-TW', { maximumFractionDigits: 0 })}`
              }
            </div>
          </div>
          
          <div>
            <div className="text-sm text-keylio-text-muted mb-2">包含幣種</div>
            <div className="space-y-2">
              {data.coins.map((coin) => (
                <div 
                  key={coin.symbol}
                  className="flex items-center justify-between p-2 bg-keylio-bg-tertiary/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{coin.icon}</span>
                    <span className="text-sm text-keylio-text-primary">{coin.symbol}</span>
                  </div>
                  <span className="text-sm font-medium text-keylio-text-primary">
                    {hideBalance ? "••••" : formatUSD(coin.valueUSD)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2 border-t border-keylio-border-primary">
            <p className="text-xs text-keylio-text-muted flex items-center gap-1">
              <Info className="w-3 h-3" />
              {config.description}
            </p>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export const StablecoinAssetCard = memo(StablecoinAssetCardComponent);
