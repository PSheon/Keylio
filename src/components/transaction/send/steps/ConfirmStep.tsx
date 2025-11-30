"use client";

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, AlertTriangle, Fingerprint, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TokenIcon } from "@/components/ui/token-icon";
import { formatUSD } from "@/lib/formatters";
import { getTokenValueUSD } from "@/lib/tokens";
import { AuthDialog } from "@/components/auth";
import type { SendFormData } from "../types";

interface ConfirmStepProps {
  data: SendFormData;
  fromAddress: string;
  onConfirm: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

/**
 * Step 3: 確認摘要 + 驗證 Dialog
 * 分層設計：主摘要區 + 細節區 + 手續費可展開
 * 點擊確認後彈出 Auth Dialog
 */
function ConfirmStepComponent({
  data,
  fromAddress,
  onConfirm,
  onBack,
  isProcessing,
}: ConfirmStepProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showFeeDetails, setShowFeeDetails] = useState(false);

  const valueUSD = useMemo(
    () => getTokenValueUSD(data.amount || "0", data.token),
    [data.amount, data.token]
  );

  return (
    <>
      <div className="space-y-3 py-4">
        {/* ===== 主摘要區：金額突出 ===== */}
        <div className="bg-keylio-bg-primary rounded-xl border border-keylio-border-primary p-5">
          <div className="flex flex-col items-center">
            <TokenIcon symbol={data.token} size="48px" />
            <p className="text-3xl font-bold text-keylio-text-primary mt-3">
              {data.amount} {data.token}
            </p>
            <p className="text-base text-keylio-text-muted mt-1">
              {formatUSD(valueUSD)}
            </p>
          </div>
        </div>

        {/* ===== 細節區：發送方/接收方 + 手續費 ===== */}
        <div className="bg-keylio-bg-primary rounded-xl border border-keylio-border-primary p-4 space-y-3">
          {/* 發送自 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-keylio-text-muted">發送自</span>
            <div className="flex items-center gap-2">
              <Wallet className="w-3.5 h-3.5 text-keylio-text-muted" />
              <span className="text-sm text-keylio-text-secondary">主錢包</span>
              <span className="font-mono text-xs text-gray-500">
                {fromAddress.slice(0, 6)}...{fromAddress.slice(-4)}
              </span>
            </div>
          </div>

          {/* 發送至 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-keylio-text-muted">發送至</span>
            <div className="text-right">
              <span className="text-sm text-keylio-teal font-medium">
                {data.recipientName || "未命名"}
              </span>
              <span className="font-mono text-xs text-gray-500 ml-2">
                {data.recipient.slice(0, 6)}...{data.recipient.slice(-4)}
              </span>
            </div>
          </div>

          {/* 備註 */}
          {data.note ? (
            <div className="flex justify-between items-start">
              <span className="text-sm text-keylio-text-muted">備註</span>
              <span className="text-sm text-keylio-text-secondary text-right max-w-[200px]">
                {data.note}
              </span>
            </div>
          ) : null}

          {/* 分隔線 */}
          <div className="h-px bg-keylio-border-primary" />

          {/* 手續費 - 可展開 */}
          <div>
            <button
              onClick={() => setShowFeeDetails(!showFeeDetails)}
              className="w-full flex justify-between items-center group"
            >
              <span className="text-sm text-keylio-text-muted">手續費</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-teal-400 font-medium">
                  $0.00 <span className="text-keylio-text-muted font-normal">(預估)</span>
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-keylio-text-muted transition-transform ${showFeeDetails ? "rotate-90" : ""}`}
                />
              </div>
            </button>

            {/* 手續費詳情 */}
            {showFeeDetails ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-3 bg-keylio-bg-tertiary rounded-lg space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-keylio-text-muted">Gas Price</span>
                    <span className="text-keylio-text-secondary font-mono">0 Gwei</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-keylio-text-muted">Gas Limit</span>
                    <span className="text-keylio-text-secondary font-mono">21,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-keylio-text-muted">Network</span>
                    <span className="text-keylio-text-secondary">Plasma Testnet</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-keylio-border-primary">
                    <span className="text-keylio-text-muted">由 Keylio 贊助</span>
                    <span className="text-teal-400">✨ 免費</span>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>

        {/* ===== 警告區 ===== */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300/80">
            確認後交易將立即送出，無法取消
          </p>
        </div>

        {/* ===== 動作區 ===== */}
        <div className="flex gap-3 pt-3">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isProcessing}
            className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowAuthDialog(true)}
            disabled={isProcessing}
            className="flex-1 bg-keylio-teal hover:bg-keylio-teal/90 h-11"
          >
            <Fingerprint className="w-4 h-4 mr-2" />
            確認發送
          </Button>
        </div>
      </div>

      {/* ===== Auth Dialog ===== */}
      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={onConfirm}
        description="請驗證身份以確認交易"
      />
    </>
  );
}

export const ConfirmStep = memo(ConfirmStepComponent);
