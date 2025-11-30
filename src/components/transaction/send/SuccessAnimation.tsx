"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { formatUSD } from "@/lib/formatters";
import type { SendResult } from "./types";

interface SuccessAnimationProps {
  amount: string;
  token: string;
  valueUSD: number;
  recipientName?: string;
  result: SendResult;
  onDone: () => void;
}

/**
 * 發送成功動畫
 * 打勾動畫 + 交易資訊
 */
function SuccessAnimationComponent({
  amount,
  token,
  valueUSD,
  recipientName,
  result,
  onDone,
}: SuccessAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      {/* Success checkmark animation */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500/20 blur-xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Icon */}
        <div className="relative w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.4, delay: 0.2 }}
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
        </div>
      </motion.div>

      {/* Success text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-1"
      >
        <h3 className="text-lg font-semibold text-keylio-text-primary">發送成功！</h3>
        <p className="text-2xl font-bold text-keylio-teal">
          {amount} {token}
        </p>
        <p className="text-sm text-keylio-text-muted">{formatUSD(valueUSD)}</p>
        {recipientName ? (
          <p className="text-sm text-keylio-text-secondary">
            已發送給 {recipientName}
          </p>
        ) : null}
      </motion.div>

      {/* Transaction hash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full p-3 bg-keylio-bg-tertiary rounded-lg"
      >
        <p className="text-xs text-keylio-text-muted mb-1">交易 Hash</p>
        <p className="text-xs font-mono text-keylio-text-secondary break-all">
          {result.hash.slice(0, 16)}...{result.hash.slice(-12)}
        </p>
        {ACTIVE_CHAIN.explorerUrl ? (
          <a
            href={`${ACTIVE_CHAIN.explorerUrl}/tx/${result.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-keylio-teal hover:underline mt-2"
          >
            <ExternalLink className="w-3 h-3" />
            查看區塊瀏覽器
          </a>
        ) : null}
      </motion.div>

      {/* Done button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full"
      >
        <Button
          onClick={onDone}
          className="w-full bg-keylio-teal hover:bg-keylio-teal/90"
        >
          完成
        </Button>
      </motion.div>
    </div>
  );
}

export const SuccessAnimation = memo(SuccessAnimationComponent);
