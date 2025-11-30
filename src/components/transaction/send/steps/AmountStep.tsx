"use client";

import { memo, useState, useMemo, useEffect } from "react";
import { ChevronLeft, Sparkles, AlertCircle, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TokenIcon } from "@/components/ui/token-icon";
import { useMultiTokenBalance } from "@/hooks/useTokenBalance";
import { formatUSD } from "@/lib/formatters";
import { getAllTokens, formatTokenAmount, getTokenValueUSD, getNativeToken } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { SendFormData } from "../types";

interface AmountStepProps {
  data: SendFormData;
  fromAddress: string;
  onUpdate: (data: Partial<SendFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onReceive?: () => void; // 用於無餘額時導向接收
}

/** 百分比快選選項 */
const PERCENTAGE_OPTIONS = [10, 25, 50, 100] as const;
type PercentageOption = typeof PERCENTAGE_OPTIONS[number];

/**
 * Step 2: 幣種 + 金額 + 備註
 * 優化:
 * - 自動選取有餘額的幣種（原生幣 > USDT > USDC）
 * - 快速金額改為百分比選擇
 */
function AmountStepComponent({ data, fromAddress, onUpdate, onNext, onBack, onReceive }: AmountStepProps) {
  const [selectedPercentage, setSelectedPercentage] = useState<PercentageOption | null>(null);

  const tokens = useMemo(() => getAllTokens(), []);
  const tokenAddresses = useMemo(() => tokens.map(t => t.address), [tokens]);
  const nativeToken = useMemo(() => getNativeToken(), []);

  // 一次性取得所有 token 餘額
  const { data: balances, isLoading: isLoadingBalances } = useMultiTokenBalance(tokenAddresses, fromAddress);

  // 計算各 token 的格式化餘額
  const tokenBalances = useMemo(() => {
    if (!balances) return {};
    const result: Record<string, { raw: bigint; formatted: string; hasBalance: boolean }> = {};
    tokens.forEach(token => {
      const raw = balances[token.address] || BigInt(0);
      const formatted = formatTokenAmount(raw, token.decimals);
      result[token.symbol] = {
        raw,
        formatted,
        hasBalance: raw > BigInt(0),
      };
    });
    return result;
  }, [balances, tokens]);

  // 篩選有餘額的 token
  const tokensWithBalance = useMemo(() => {
    return tokens.filter(t => tokenBalances[t.symbol]?.hasBalance);
  }, [tokens, tokenBalances]);

  // 自動選取有餘額的幣種（原生幣 > USDT > USDC）
  useEffect(() => {
    if (isLoadingBalances || !balances) return;

    // 如果當前選中的幣種有餘額，不需要改變
    if (tokenBalances[data.token]?.hasBalance) return;

    // 按優先順序選取：原生幣 > USDT > USDC
    const priorityOrder = [nativeToken.symbol, 'USDT', 'USDC'];

    for (const symbol of priorityOrder) {
      if (tokenBalances[symbol]?.hasBalance) {
        onUpdate({ token: symbol, amount: "" });
        return;
      }
    }

    // 如果以上都沒有餘額，選第一個有餘額的
    const firstWithBalance = tokensWithBalance[0];
    if (firstWithBalance) {
      onUpdate({ token: firstWithBalance.symbol, amount: "" });
    }
  }, [isLoadingBalances, balances, tokenBalances, data.token, nativeToken.symbol, tokensWithBalance, onUpdate]);

  const currentToken = useMemo(
    () => tokens.find(t => t.symbol === data.token),
    [tokens, data.token]
  );

  const currentBalance = tokenBalances[data.token];
  const formattedBalance = currentBalance?.formatted || "0";
  const numericBalance = parseFloat(formattedBalance);

  const valueUSD = currentToken
    ? getTokenValueUSD(data.amount || "0", currentToken.symbol)
    : 0;

  const canProceed =
    parseFloat(data.amount) > 0 &&
    parseFloat(data.amount) <= numericBalance;

  // 處理百分比選擇
  const handlePercentageSelect = (percentage: PercentageOption) => {
    setSelectedPercentage(percentage);
    const calculatedAmount = (numericBalance * percentage / 100).toFixed(
      currentToken?.symbol === "ETH" || currentToken?.symbol === "XPL" ? 6 : 2
    );
    onUpdate({ amount: calculatedAmount });
  };

  const handleTokenSelect = (symbol: string) => {
    setSelectedPercentage(null);
    onUpdate({ token: symbol, amount: "" });
  };

  const handleAmountChange = (value: string) => {
    setSelectedPercentage(null);
    onUpdate({ amount: value });
  };

  // 無餘額狀態
  if (!isLoadingBalances && tokensWithBalance.length === 0) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-keylio-bg-tertiary flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-keylio-text-muted" />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-keylio-text-primary">目前沒有可發送的資產</h3>
          <p className="text-sm text-keylio-text-muted">
            您的錢包目前沒有任何餘額，請先接收資產後再發送
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={onReceive}
            className="flex-1 bg-keylio-teal hover:bg-keylio-teal/90"
          >
            <ArrowDownToLine className="w-4 h-4 mr-2" />
            接收資產
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-4">
      {/* 幣種選擇 - 清晰列表 */}
      <div className="space-y-2">
        <Label>選擇代幣</Label>
        <div className="space-y-1 max-h-52 overflow-y-auto rounded-lg border border-keylio-border-primary bg-keylio-bg-primary p-1">
          {isLoadingBalances ? (
            // 載入中骨架
            <div className="space-y-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-keylio-bg-tertiary" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-16 bg-keylio-bg-tertiary rounded" />
                    <div className="h-3 w-24 bg-keylio-bg-tertiary rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            tokens.map((token) => {
              const balance = tokenBalances[token.symbol];
              const isSelected = data.token === token.symbol;
              const hasBalance = balance?.hasBalance;

              return (
                <button
                  key={token.symbol}
                  onClick={() => hasBalance && handleTokenSelect(token.symbol)}
                  disabled={!hasBalance}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left",
                    isSelected
                      ? "bg-keylio-teal/10 border border-keylio-teal"
                      : hasBalance
                        ? "hover:bg-keylio-bg-tertiary"
                        : "opacity-40 cursor-not-allowed"
                  )}
                >
                  <TokenIcon symbol={token.symbol} size="32px" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-keylio-text-primary">
                        {token.symbol}
                      </span>
                      {!hasBalance && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-keylio-bg-tertiary text-keylio-text-muted">
                          無餘額
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-keylio-text-muted truncate">
                      {token.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-medium tabular-nums",
                      hasBalance ? "text-keylio-text-primary" : "text-keylio-text-muted"
                    )}>
                      {parseFloat(balance?.formatted || "0").toFixed(4)}
                    </p>
                    {hasBalance ? <p className="text-xs text-keylio-text-muted">
                        {formatUSD(getTokenValueUSD(balance.formatted, token.symbol))}
                      </p> : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
        <p className="text-xs text-keylio-text-muted">
          已選: {data.token} · 可用餘額 {numericBalance.toFixed(4)}
        </p>
      </div>

      {/* 金額輸入 */}
      <div className="space-y-2">
        <Label>金額</Label>
        <div className="relative">
          <Input
            type="number"
            value={data.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className="bg-keylio-bg-primary border-keylio-border-primary text-lg font-semibold h-12 pr-16"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-keylio-text-muted text-sm">
            {data.token}
          </span>
        </div>

        {/* USD 價值 - 固定高度避免跳動 */}
        <div className="h-5">
          {data.amount && parseFloat(data.amount) > 0 ? (
            <p className="text-sm text-keylio-text-muted">≈ {formatUSD(valueUSD)}</p>
          ) : null}
        </div>

        {/* 百分比快選 */}
        <div className="flex gap-2">
          {PERCENTAGE_OPTIONS.map(percentage => (
            <button
              key={percentage}
              onClick={() => handlePercentageSelect(percentage)}
              disabled={numericBalance <= 0}
              className={cn(
                "flex-1 text-xs py-2 rounded-lg font-medium transition-all",
                selectedPercentage === percentage
                  ? "bg-keylio-teal text-white"
                  : "bg-keylio-bg-tertiary text-keylio-text-secondary hover:bg-keylio-teal/20",
                numericBalance <= 0 && "opacity-50 cursor-not-allowed"
              )}
            >
              {percentage === 100 ? "全部" : `${percentage}%`}
            </button>
          ))}
        </div>

        {/* 手續費提示 - 固定高度避免跳動 */}
        <div className="h-5 mt-2">
          {data.amount && parseFloat(data.amount) > 0 ? (
            <div className="flex items-center gap-2 text-xs text-teal-400">
              <Sparkles className="w-3 h-3" />
              <span>零手續費・對方收到 {data.amount} {data.token}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 備註 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>備註</Label>
          <span className="text-xs text-keylio-text-muted">可選</span>
        </div>
        <Textarea
          value={data.note}
          onChange={(e) => onUpdate({ note: e.target.value })}
          placeholder="便於記錄追蹤"
          className="bg-keylio-bg-primary border-keylio-border-primary resize-none h-16"
        />
      </div>

      {/* 按鈕 */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 bg-keylio-teal hover:bg-keylio-teal/90"
        >
          下一步
        </Button>
      </div>
    </div>
  );
}

export const AmountStep = memo(AmountStepComponent);
