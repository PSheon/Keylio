"use client";

import { useState, useMemo, memo } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  Wallet,
  ListTree,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMultiTokenBalance } from "@/hooks/useTokenBalance";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { formatUSD, formatTokenBalance } from "@/lib/formatters";
import { getStablecoins, getNativeToken, formatTokenAmount, getTokenValueUSD } from "@/lib/tokens";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useWalletStore } from "@/stores/useWalletStore";
import { AssetDetailDialog } from "./AssetDetailDialog";

/** 幣種資料結構 */
interface CoinData {
  symbol: string;
  name: string;
  ledgerId: string;
  ticker: string;
  balance: string;
  valueUSD: number;
  contractAddress: string;
  isNative?: boolean;
  network?: string;
}

/**
 * 資產卡片 - Uniswap Style
 *
 * 設計重點（簡化版）：
 * 1. 標題「資產」+ 查看完整資產按鈕
 * 2. 簡潔的資產列表：圖示 + 名稱/數量 + USD 價值
 * 3. 移除 Tab 切換、多餘資訊顯示
 * 4. 支援隱藏資產功能
 */
function AssetCardComponent() {
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const hideBalancesSetting = useSettingsStore((state) => state.hideBalances);

  // 根據全域設定判斷是否隱藏餘額
  const shouldHideBalance = hideBalancesSetting === 'always-hide';

  const activeWallet = wallets.find(w => w.id === activeWalletId);

  // Get tokens: native + stablecoins
  const nativeToken = useMemo(() => getNativeToken(), []);
  const stablecoins = useMemo(() => getStablecoins(), []);
  const allDisplayTokens = useMemo(() => [nativeToken, ...stablecoins], [nativeToken, stablecoins]);

  const tokenAddresses = useMemo(
    () => allDisplayTokens.map(t => t.address),
    [allDisplayTokens]
  );

  // Fetch balances
  const { data: balances, isLoading, error } = useMultiTokenBalance(
    tokenAddresses,
    activeWallet?.address
  );

  // Calculate coin data - always show all tokens even if balance is 0
  const { coinList, totalValueUSD } = useMemo(() => {
    let totalValueUSD = 0;
    const coinList: CoinData[] = [];

    // Process all tokens - always include them even if balance is 0
    allDisplayTokens.forEach((token) => {
      const balance = balances?.[token.address] ?? BigInt(0);
      const formattedBalance = formatTokenAmount(balance, token.decimals);
      const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);

      totalValueUSD += valueUSD;

      coinList.push({
        symbol: token.symbol,
        name: token.name,
        ledgerId: token.ledgerId,
        ticker: token.ticker,
        balance: formattedBalance,
        valueUSD,
        contractAddress: token.address,
        isNative: token.isNative,
        network: token.network,
      });
    });

    return { coinList, totalValueUSD };
  }, [balances, allDisplayTokens]);

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary overflow-hidden"
    >
      {/* Header - 與近期活動相同樣式 */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-keylio-text-primary">
            資產
          </h3>
          {/* 查看完整資產按鈕 */}
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

      {/* Asset List - 參考近期活動區塊樣式 */}
      {isLoading ? (
        <div className="border-t border-keylio-border-primary">
          <div className="divide-y divide-keylio-border-primary">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="w-10 h-10 rounded-full bg-keylio-bg-tertiary" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 bg-keylio-bg-tertiary mb-1" />
                  <Skeleton className="h-3 w-24 bg-keylio-bg-tertiary" />
                </div>
                <Skeleton className="h-4 w-16 bg-keylio-bg-tertiary" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="px-5 pb-5">
          <div className="p-4 text-center text-red-400 text-sm">連接失敗</div>
        </div>
      ) : totalValueUSD === 0 ? (
        /* Empty state */
        <div className="px-5 pb-5">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-keylio-bg-tertiary flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-keylio-text-muted" />
            </div>
            <p className="text-keylio-text-secondary font-medium mb-1">
              尚未持有任何資產
            </p>
            <p className="text-sm text-keylio-text-muted mb-4">
              開始接收 {nativeToken.symbol}、USDT 或 USDC
            </p>
            <ReceiveDialog
              address={activeWallet?.address || ""}
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
        /* Asset list - 與近期活動相同樣式 */
        <div className="border-t border-keylio-border-primary">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="divide-y divide-keylio-border-primary"
          >
            {coinList.map((coin) => (
              <AssetRow key={coin.symbol} coin={coin} hideBalance={shouldHideBalance} />
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Asset Row - Uniswap Style
 *
 * 簡潔設計：
 * - 左側：圓形代幣圖示 (CryptoIcon) + 代幣名稱 + 持有數量
 * - 右側：USD 價值
 * - 支援隱藏餘額
 */
interface AssetRowProps {
  coin: CoinData;
  hideBalance?: boolean;
}

function AssetRow({ coin, hideBalance }: AssetRowProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <motion.button
          variants={staggerItem}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-keylio-bg-tertiary transition-colors text-left"
        >
          {/* Left: Icon + Name + Balance */}
          <div className="flex items-center gap-3">
            {/* Token Icon - Using Ledger CryptoIcon */}
            <CryptoIcon
              ledgerId={coin.ledgerId}
              ticker={coin.ticker}
              size="40px"
              network={coin.network}
            />

            {/* Token Info */}
            <div>
              <div className="font-medium text-keylio-text-primary text-sm">
                {coin.name}
              </div>
              <div className="text-xs text-keylio-text-muted">
                {hideBalance ? "••••" : formatTokenBalance(coin.balance)} {coin.symbol}
              </div>
            </div>
          </div>

          {/* Right: USD Value */}
          <div className="text-right">
            <span className="font-semibold text-sm text-keylio-text-primary">
              {hideBalance ? "••••" : formatUSD(coin.valueUSD)}
            </span>
          </div>
        </motion.button>
      </DialogTrigger>

      {/* Detail Dialog */}
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <CryptoIcon
              ledgerId={coin.ledgerId}
              ticker={coin.ticker}
              size="40px"
              network={coin.network}
            />
            {coin.name}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {/* Balance Card */}
          <div className="bg-keylio-bg-tertiary rounded-xl p-4">
            <div className="text-sm text-keylio-text-muted mb-1">持有數量</div>
            <div className="text-2xl font-bold text-keylio-text-primary">
              {hideBalance ? "••••••" : `${formatTokenBalance(coin.balance)} ${coin.symbol}`}
            </div>
            <div className="text-base text-keylio-text-secondary mt-1">
              {hideBalance ? "••••••" : `≈ ${formatUSD(coin.valueUSD)}`}
            </div>
          </div>

          {/* Token Details */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-keylio-text-muted">代幣類型</span>
              <span className="text-keylio-text-primary">
                {coin.isNative ? '原生代幣' : 'ERC-20'}
              </span>
            </div>
            {!coin.isNative && (
              <div className="flex justify-between text-sm">
                <span className="text-keylio-text-muted">合約地址</span>
                <span className="text-keylio-text-primary font-mono text-xs">
                  {coin.contractAddress.slice(0, 6)}...{coin.contractAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export const AssetCard = memo(AssetCardComponent);
