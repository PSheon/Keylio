"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Copy,
  Blocks,
  Hash,
  Fuel,
  Calendar,
  User,
  Tag,
  FileText,
  ChevronDown,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { formatCurrency, formatDateTime, formatRelativeTime, shortenAddress } from "@/lib/formatters";
import type { Transaction } from "@/lib/storage/db";
import { showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

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
 *
 * 設計重點：
 * - 頂部簡潔：小 Badge + 三層金額顯示
 * - 核心資訊區（預設展開）+ 技術細節區（可折疊）
 * - 整行可點擊複製
 */
function TransactionDetailDialogComponent({
  transaction,
  walletAddress,
  open,
  onOpenChange,
}: TransactionDetailDialogProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // 計算交易類型
  const txMeta = useMemo(() => {
    if (!transaction) return null;

    const isIncoming = transaction.to.toLowerCase() === walletAddress.toLowerCase();
    const isSwap = false; // TODO: 根據 transaction.type 判斷

    return {
      isIncoming,
      isSwap,
      direction: isSwap ? "swap" : isIncoming ? "receive" : "send",
      directionLabel: isSwap ? "兌換" : isIncoming ? "收到" : "發送",
      amountSign: isIncoming ? "+" : "-",
      counterparty: isIncoming ? transaction.from : transaction.to,
      // 判斷是否為鏈上同步的交易
      isSynced: transaction.note === "鏈上同步",
    };
  }, [transaction, walletAddress]);

  // 複製到剪貼簿 - 必須在 early return 之前
  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} 已複製`);
  }, []);

  // 開啟區塊瀏覽器 - 必須在 early return 之前
  const openExplorer = useCallback(() => {
    if (!transaction) return;
    const url = `${ACTIVE_CHAIN.explorerUrl}/tx/${transaction.hash}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [transaction]);

  // 狀態樣式（簡化為小 Badge）- 必須在 early return 之前
  const statusBadge = useMemo(() => {
    if (!transaction) {
      return {
        bg: "bg-keylio-bg-tertiary",
        text: "text-keylio-text-muted",
        dot: "bg-keylio-text-muted",
        label: "未知",
      };
    }

    switch (transaction.status) {
      case "confirmed":
        return {
          bg: "bg-green-500/10",
          text: "text-green-400",
          dot: "bg-green-400",
          label: "已確認",
        };
      case "pending":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          dot: "bg-amber-400",
          label: "待確認",
        };
      case "failed":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          dot: "bg-red-400",
          label: "失敗",
        };
      default:
        return {
          bg: "bg-keylio-bg-tertiary",
          text: "text-keylio-text-muted",
          dot: "bg-keylio-text-muted",
          label: "未知",
        };
    }
  }, [transaction]);

  // 獲取區塊瀏覽器名稱 - 必須在 early return 之前
  const explorerName = useMemo(() => {
    if (ACTIVE_CHAIN.explorerUrl.includes("etherscan")) return "Etherscan";
    if (ACTIVE_CHAIN.explorerUrl.includes("sepolia")) return "Sepolia Etherscan";
    return "區塊瀏覽器";
  }, []);

  // Early return 必須在所有 hooks 之後
  if (!transaction || !txMeta) return null;

  const amount = parseFloat(transaction.amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>交易詳情</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* ====== 頂部：三層縱向排列 ====== */}
          <div className="text-center py-2">
            {/* 第一行：方向 + 狀態 Badge */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-keylio-text-secondary text-sm">
                {txMeta.directionLabel}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                  statusBadge.bg,
                  statusBadge.text
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", statusBadge.dot)} />
                {statusBadge.label}
              </span>
            </div>

            {/* 第二行：大字金額 */}
            <h3
              className={cn(
                "text-3xl font-bold",
                txMeta.isIncoming ? "text-green-400" : "text-keylio-text-primary"
              )}
            >
              {txMeta.amountSign}{amount.toFixed(4)} {transaction.token}
            </h3>

            {/* 第三行：USD 估值 */}
            <p className="text-keylio-text-muted text-sm mt-1">
              ≈ {formatCurrency(amount)}
            </p>
          </div>

          {/* ====== 核心資訊區 ====== */}
          <div className="bg-keylio-bg-tertiary/50 rounded-xl border border-keylio-border-primary divide-y divide-keylio-border-primary">
            {/* 來自/發送至 */}
            <CopyableRow
              icon={<User className="w-4 h-4" />}
              label={txMeta.isIncoming ? "來自錢包" : "發送至"}
              value={shortenAddress(txMeta.counterparty)}
              fullValue={txMeta.counterparty}
              onCopy={() => handleCopy(txMeta.counterparty, "地址")}
            />

            {/* 交易雜湊 */}
            <CopyableRow
              icon={<Hash className="w-4 h-4" />}
              label="交易雜湊"
              value={shortenAddress(transaction.hash, { startChars: 10, endChars: 8 })}
              fullValue={transaction.hash}
              subValue="Tx Hash"
              onCopy={() => handleCopy(transaction.hash, "交易雜湊")}
            />

            {/* 交易時間 */}
            <DetailRow
              icon={<Calendar className="w-4 h-4" />}
              label="交易時間"
              value={formatDateTime(transaction.timestamp)}
              subValue={formatRelativeTime(transaction.timestamp)}
            />

            {/* 同步狀態（如果是鏈上同步的交易） */}
            {txMeta.isSynced ? <DetailRow
                icon={<RefreshCw className="w-4 h-4" />}
                label="同步狀態"
                value="鏈上同步"
                valueClassName="text-keylio-text-muted"
              /> : null}
          </div>

          {/* ====== 技術細節區（可折疊） ====== */}
          <div className="bg-keylio-bg-tertiary/30 rounded-xl border border-keylio-border-primary overflow-hidden">
            {/* 折疊標題 */}
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-keylio-bg-tertiary/50 transition-colors"
            >
              <span className="text-sm text-keylio-text-muted">技術細節</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-keylio-text-muted transition-transform duration-200",
                  showTechnicalDetails && "rotate-180"
                )}
              />
            </button>

            {/* 折疊內容 */}
            <AnimatePresence>
              {showTechnicalDetails ? <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="divide-y divide-keylio-border-primary border-t border-keylio-border-primary"
                >
                  {/* 區塊高度 */}
                  <DetailRow
                    icon={<Blocks className="w-4 h-4" />}
                    label="區塊高度"
                    value={transaction.status === "confirmed" ? "19,234,567" : "待確認"}
                    tooltip="可用來在鏈上對應此筆交易"
                  />

                  {/* Gas 費用（拆層顯示） */}
                  <GasDetailRow />

                  {/* 分類標籤 */}
                  {transaction.label ? <DetailRow
                      icon={<Tag className="w-4 h-4" />}
                      label="分類"
                      value={transaction.label}
                    /> : null}

                  {/* 備註（排除鏈上同步） */}
                  <DetailRow
                    icon={<FileText className="w-4 h-4" />}
                    label="備註"
                    value={txMeta.isSynced ? "無備註" : (transaction.note || "無備註")}
                    valueClassName={(!transaction.note || txMeta.isSynced) ? "text-keylio-text-muted" : undefined}
                  />
                </motion.div> : null}
            </AnimatePresence>
          </div>

          {/* ====== 底部按鈕 ====== */}
          <div className="pt-1">
            <Button
              variant="outline"
              className="w-full border-keylio-border-primary hover:bg-keylio-bg-tertiary"
              onClick={openExplorer}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              在 {explorerName} 查看
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** 詳情列組件（不可複製） */
interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  tooltip?: string;
  valueClassName?: string;
}

function DetailRow({ icon, label, value, subValue, tooltip, valueClassName }: DetailRowProps) {
  const content = (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2 text-keylio-text-muted">
        {icon}
        <span className="text-sm">{label}</span>
        {tooltip ? <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-keylio-text-muted/50 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> : null}
      </div>
      <div className="text-right">
        <span className={cn("text-sm font-medium text-keylio-text-primary", valueClassName)}>
          {value}
        </span>
        {subValue ? <p className="text-xs text-keylio-text-muted mt-0.5">{subValue}</p> : null}
      </div>
    </div>
  );

  return content;
}

/** 可複製的詳情列組件 */
interface CopyableRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullValue: string;
  subValue?: string;
  onCopy: () => void;
}

function CopyableRow({ icon, label, value, fullValue, subValue, onCopy }: CopyableRowProps) {
  return (
    <button
      onClick={onCopy}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-keylio-bg-tertiary/50 transition-colors group text-left"
    >
      <div className="flex items-center gap-2 text-keylio-text-muted">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium text-keylio-text-primary font-mono cursor-pointer">
                  {value}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[300px] break-all">
                <p className="font-mono text-xs">{fullValue}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {subValue ? <p className="text-xs text-keylio-text-muted mt-0.5">{subValue}</p> : null}
        </div>
        <Copy className="w-3.5 h-3.5 text-keylio-text-muted/50 group-hover:text-keylio-text-muted transition-colors" />
      </div>
    </button>
  );
}

/** Gas 費用詳情列（拆層顯示） */
function GasDetailRow() {
  // Mock 資料 - 實際應從交易回執獲取
  const gasUSD = 2.34;
  const gasETH = 0.0012;
  const gasPrice = 15; // gwei

  return (
    <div className="flex items-start justify-between px-4 py-3">
      <div className="flex items-center gap-2 text-keylio-text-muted">
        <Fuel className="w-4 h-4" />
        <span className="text-sm">Gas 費用</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-keylio-text-muted/50 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">手續費由網路決定，實際可能略有差異</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium text-keylio-text-primary">
          ${gasUSD.toFixed(2)}
        </span>
        <p className="text-xs text-keylio-text-muted mt-0.5">
          {gasETH} ETH @ {gasPrice} gwei
        </p>
      </div>
    </div>
  );
}

export const TransactionDetailDialog = memo(TransactionDetailDialogComponent);
