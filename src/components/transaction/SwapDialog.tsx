"use client";

import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpDown,
  Loader2,
  CheckCircle,
  Info,
  Fingerprint,
} from "lucide-react";
import { useShallow } from 'zustand/react/shallow';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TokenIcon } from "@/components/ui/token-icon";
import { fadeInUp, stepTransition, fadeIn } from "@/lib/animations";
import { formatUSD } from "@/lib/formatters";
import { showSuccess, showError } from "@/lib/toast";
import { useWalletStore } from "@/stores/useWalletStore";

interface SwapDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

type SwapStep = 'input' | 'preview' | 'processing' | 'success';

// Supported swap pairs - Spec: USDT ↔ USDC
const SWAP_TOKENS = [
  { symbol: 'USDT', name: 'Tether USD', balance: 1000 },
  { symbol: 'USDC', name: 'USD Coin', balance: 500 },
];

// Mock exchange rate (in production, fetch from DEX/API)
const getExchangeRate = (from: string, to: string): number => {
  // USDT/USDC is roughly 1:1 with small variance
  if (from === 'USDT' && to === 'USDC') return 0.9998;
  if (from === 'USDC' && to === 'USDT') return 1.0002;
  return 1;
};

/**
 * 兌換對話框
 * Spec: 支持 USDT ↔ USDC，實時匯率，一鍵反轉
 */
function SwapDialogComponent({ trigger, onSuccess }: SwapDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<SwapStep>('input');
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  // isProcessing will be used for real DEX integration
  const [, setIsProcessing] = useState(false);

  // Get wallet state
  const { wallets, activeWalletId } = useWalletStore(
    useShallow((state) => ({
      wallets: state.wallets,
      activeWalletId: state.activeWalletId,
    }))
  );
  // activeWallet will be used for real DEX integration
  void wallets; void activeWalletId;

  // Get token data
  const fromTokenData = SWAP_TOKENS.find(t => t.symbol === fromToken);
  const toTokenData = SWAP_TOKENS.find(t => t.symbol === toToken);

  // Calculate exchange
  const exchangeRate = useMemo(() =>
    getExchangeRate(fromToken, toToken),
    [fromToken, toToken]
  );

  const receiveAmount = useMemo(() => {
    const inputAmount = parseFloat(amount) || 0;
    return (inputAmount * exchangeRate).toFixed(2);
  }, [amount, exchangeRate]);

  // Price impact (mock - in production, calculate from DEX)
  const priceImpact = useMemo(() => {
    const inputAmount = parseFloat(amount) || 0;
    if (inputAmount < 100) return 0.01;
    if (inputAmount < 1000) return 0.05;
    return 0.1;
  }, [amount]);

  // Handlers
  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const handleMaxAmount = () => {
    if (fromTokenData) {
      setAmount(fromTokenData.balance.toString());
    }
  };

  const handlePreview = () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError("請輸入兌換金額");
      return;
    }
    if (fromTokenData && parseFloat(amount) > fromTokenData.balance) {
      showError("餘額不足", "兌換金額超過可用餘額");
      return;
    }
    setStep('preview');
  };

  const handleConfirmSwap = async () => {
    setStep('processing');
    setIsProcessing(true);

    try {
      // TODO: Implement actual swap logic with DEX
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      setStep('success');
      showSuccess("兌換成功", `已將 ${amount} ${fromToken} 兌換為 ${receiveAmount} ${toToken}`);
      onSuccess?.();
    } catch {
      showError("兌換失敗", "請稍後重試");
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setStep('input');
      setAmount('');
    }, 300);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => {
        setStep('input');
        setAmount('');
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-keylio-teal hover:bg-keylio-teal/90">
            兌換
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="text-keylio-text-primary">
            {step === 'success' ? '兌換成功' : '兌換幣種'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {step === 'input' && (
            <motion.div
              key="input"
              variants={stepTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              {/* From Token */}
              <div className="space-y-2">
                <Label className="text-keylio-text-secondary">從</Label>
                <div className="flex gap-2">
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className="w-32 bg-keylio-bg-tertiary border-keylio-border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
                      {SWAP_TOKENS.filter(t => t.symbol !== toToken).map(token => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <span className="flex items-center gap-2">
                            <TokenIcon symbol={token.symbol} size="20px" />
                            <span>{token.symbol}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-keylio-bg-tertiary border-keylio-border-primary text-right pr-16"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMaxAmount}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs text-keylio-teal hover:text-keylio-teal"
                    >
                      MAX
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-keylio-text-muted text-right">
                  餘額: {formatUSD(fromTokenData?.balance || 0)}
                </p>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSwapTokens}
                  className="h-10 w-10 rounded-full bg-keylio-bg-tertiary border border-keylio-border-primary hover:bg-keylio-teal/10"
                >
                  <ArrowUpDown className="w-4 h-4 text-keylio-teal" />
                </Button>
              </div>

              {/* To Token */}
              <div className="space-y-2">
                <Label className="text-keylio-text-secondary">兌換為</Label>
                <div className="flex gap-2">
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger className="w-32 bg-keylio-bg-tertiary border-keylio-border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
                      {SWAP_TOKENS.filter(t => t.symbol !== fromToken).map(token => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <span className="flex items-center gap-2">
                            <TokenIcon symbol={token.symbol} size="20px" />
                            <span>{token.symbol}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex-1">
                    <Input
                      type="text"
                      value={receiveAmount}
                      disabled
                      className="bg-keylio-bg-tertiary border-keylio-border-primary text-right text-keylio-text-primary"
                    />
                  </div>
                </div>
                <p className="text-xs text-keylio-text-muted text-right">
                  餘額: {formatUSD(toTokenData?.balance || 0)}
                </p>
              </div>

              {/* Exchange Info */}
              <div className="bg-keylio-bg-tertiary rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-keylio-text-muted">匯率</span>
                  <span className="text-keylio-text-primary">
                    1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-keylio-text-muted flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    價格影響
                  </span>
                  <span className={priceImpact > 0.05 ? "text-amber-400" : "text-green-400"}>
                    ~{priceImpact.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-keylio-text-muted">手續費</span>
                  <span className="text-green-400">$0 (Plasma 零費用)</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handlePreview}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full h-12 bg-keylio-teal hover:bg-keylio-teal/90 text-white"
              >
                預覽兌換
              </Button>
            </motion.div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <motion.div
              key="preview"
              variants={stepTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6"
            >
              <div className="bg-keylio-bg-tertiary rounded-xl p-6 text-center">
                <p className="text-sm text-keylio-text-muted mb-2">您將兌換</p>
                <p className="text-3xl font-bold text-keylio-text-primary">
                  {amount} {fromToken}
                </p>
                <div className="my-4">
                  <ArrowUpDown className="w-6 h-6 mx-auto text-keylio-teal" />
                </div>
                <p className="text-sm text-keylio-text-muted mb-2">獲得</p>
                <p className="text-3xl font-bold text-keylio-teal">
                  {receiveAmount} {toToken}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-keylio-text-muted">匯率</span>
                  <span className="text-keylio-text-primary">
                    1 {fromToken} = {exchangeRate.toFixed(4)} {toToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-keylio-text-muted">手續費</span>
                  <span className="text-green-400">$0</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('input')}
                  className="flex-1 h-12 border-keylio-border-primary"
                >
                  返回修改
                </Button>
                <Button
                  onClick={handleConfirmSwap}
                  className="flex-1 h-12 bg-keylio-teal hover:bg-keylio-teal/90 text-white"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  確認兌換
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              variants={fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="py-12 text-center"
            >
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-keylio-teal animate-spin" />
              <p className="text-keylio-text-primary font-medium">處理中...</p>
              <p className="text-sm text-keylio-text-muted mt-2">
                請稍候，正在執行兌換
              </p>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              className="py-8 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-xl font-semibold text-keylio-text-primary mb-2">
                兌換成功！
              </p>
              <p className="text-sm text-keylio-text-muted mb-6">
                您已成功將 {amount} {fromToken} 兌換為 {receiveAmount} {toToken}
              </p>
              <Button
                onClick={handleClose}
                className="w-full h-12 bg-keylio-teal hover:bg-keylio-teal/90 text-white"
              >
                完成
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export const SwapDialog = memo(SwapDialogComponent);
export default SwapDialog;
