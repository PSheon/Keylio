"use client";

import { memo, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ExternalLink,
  Copy,
  Check,
  Clock,
  X,
  Blocks,
  Hash,
  Fuel,
  Calendar,
  User,
  Tag,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { formatCurrency, formatDateTime, shortenAddress } from "@/lib/formatters";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/storage/db";

interface TransactionDetailDialogProps {
  /** 交易資料 */
  transaction: Transaction | null;
  /** 當前錢包地址（用於判斷收/支方向） */
  walletAddress: string;
  /** Dialog 開啟狀態 */
  open: boolean;
  /** 關閉 Dialog 回調 */
  onOpenChange: (open: boolean) => void;
}

/**
 * 交易詳情 Dialog
 * 顯示單筆交易的完整資訊：
 * - Tx Hash、區塊高度、Gas 費
 * - 發送/接收地址
 * - 金額、代幣類型、狀態
 * - 鏈上瀏覽器連結
 */
function TransactionDetailDialogComponent({
  transaction,
  walletAddress,
  open,
  onOpenChange,
}: TransactionDetailDialogProps) {
  // 計算交易類型
  const txMeta = useMemo(() => {
    if (!transaction) return null;
    
    const isIncoming = transaction.to.toLowerCase() === walletAddress.toLowerCase();
    // TODO: 根據 transaction.type 判斷是否為兌換
    const isSwap = false;
    
    return {
      isIncoming,
      isSwap,
      direction: isSwap ? "swap" : isIncoming ? "receive" : "send",
      directionLabel: isSwap ? "兌換" : isIncoming ? "收款" : "支出",
      amountSign: isIncoming ? "+" : "-",
      counterparty: isIncoming ? transaction.from : transaction.to,
    };
  }, [transaction, walletAddress]);

  if (!transaction || !txMeta) return null;

  const amount = parseFloat(transaction.amount);

  // 複製到剪貼簿
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} 已複製`);
  };

  // 開啟區塊瀏覽器
  const openExplorer = () => {
    const url = `${ACTIVE_CHAIN.explorerUrl}/tx/${transaction.hash}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // 狀態樣式
  const getStatusStyle = () => {
    switch (transaction.status) {
      case "confirmed":
        return {
          bg: "bg-green-500/10",
          text: "text-green-400",
          icon: <Check className="w-4 h-4" />,
          label: "已確認",
        };
      case "pending":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          icon: <Clock className="w-4 h-4" />,
          label: "待確認",
        };
      case "failed":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          icon: <X className="w-4 h-4" />,
          label: "失敗",
        };
      default:
        return {
          bg: "bg-keylio-bg-tertiary",
          text: "text-keylio-text-muted",
          icon: null,
          label: "未知",
        };
    }
  };

  const statusStyle = getStatusStyle();

  // 方向圖標
  const getDirectionIcon = () => {
    if (txMeta.isSwap) {
      return (
        <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center">
          <ArrowRightLeft className="w-7 h-7 text-purple-400" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          txMeta.isIncoming ? "bg-green-500/10" : "bg-red-500/10"
        )}
      >
        {txMeta.isIncoming ? (
          <ArrowDownLeft className="w-7 h-7 text-green-400" />
        ) : (
          <ArrowUpRight className="w-7 h-7 text-red-400" />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>交易詳情</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* 交易摘要 */}
          <div className="flex flex-col items-center text-center py-4">
            {getDirectionIcon()}
            
            <div className="mt-4">
              <span
                className={cn(
                  "text-xs font-medium px-3 py-1 rounded-full",
                  statusStyle.bg,
                  statusStyle.text
                )}
              >
                {statusStyle.icon}
                <span className="ml-1">{statusStyle.label}</span>
              </span>
            </div>
            
            <h3
              className={cn(
                "text-3xl font-bold mt-3",
                txMeta.isIncoming ? "text-green-400" : "text-keylio-text-primary"
              )}
            >
              {txMeta.amountSign}
              {amount.toFixed(2)} {transaction.token}
            </h3>
            
            <p className="text-keylio-text-secondary mt-1">
              ≈ {formatCurrency(amount)}
            </p>
          </div>

          {/* 詳細資訊卡片 */}
          <div className="bg-keylio-bg-tertiary/50 rounded-xl border border-keylio-border-primary divide-y divide-keylio-border-primary">
            {/* 交易方向 */}
            <DetailRow
              icon={<User className="w-4 h-4" />}
              label={txMeta.isIncoming ? "來自" : "發送至"}
              value={shortenAddress(txMeta.counterparty)}
              fullValue={txMeta.counterparty}
              onCopy={() => handleCopy(txMeta.counterparty, "地址")}
            />

            {/* Tx Hash */}
            <DetailRow
              icon={<Hash className="w-4 h-4" />}
              label="交易雜湊"
              value={shortenAddress(transaction.hash, { startChars: 10, endChars: 8 })}
              fullValue={transaction.hash}
              onCopy={() => handleCopy(transaction.hash, "交易雜湊")}
            />

            {/* 時間 */}
            <DetailRow
              icon={<Calendar className="w-4 h-4" />}
              label="交易時間"
              value={formatDateTime(transaction.timestamp)}
            />

            {/* 區塊高度（Mock 資料，實際需從鏈上查詢） */}
            <DetailRow
              icon={<Blocks className="w-4 h-4" />}
              label="區塊高度"
              value={transaction.status === "confirmed" ? "19,234,567" : "待確認"}
            />

            {/* Gas 費用（Mock 資料） */}
            <DetailRow
              icon={<Fuel className="w-4 h-4" />}
              label="Gas 費用"
              value="0.0012 ETH (≈ $2.34)"
            />

            {/* 分類標籤 */}
            {transaction.label && (
              <DetailRow
                icon={<Tag className="w-4 h-4" />}
                label="分類"
                value={transaction.label}
              />
            )}

            {/* 備註 */}
            {transaction.note && (
              <DetailRow
                icon={<FileText className="w-4 h-4" />}
                label="備註"
                value={transaction.note}
              />
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-keylio-border-primary hover:bg-keylio-bg-tertiary"
              onClick={openExplorer}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              在區塊瀏覽器查看
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** 詳情列組件 */
interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullValue?: string;
  onCopy?: () => void;
}

function DetailRow({ icon, label, value, fullValue, onCopy }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2 text-keylio-text-muted">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {fullValue ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium text-keylio-text-primary font-mono cursor-help">
                  {value}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[300px] break-all">
                <p className="font-mono text-xs">{fullValue}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-sm font-medium text-keylio-text-primary">
            {value}
          </span>
        )}
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-1 hover:bg-keylio-bg-tertiary rounded transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-keylio-text-muted hover:text-keylio-text-primary" />
          </button>
        )}
      </div>
    </div>
  );
}

export const TransactionDetailDialog = memo(TransactionDetailDialogComponent);
