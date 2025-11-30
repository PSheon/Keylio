"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { TokenIcon } from "@/components/ui/token-icon";

interface SendingAnimationProps {
  token: string;
  amount: string;
}

/**
 * 發送中動畫
 * 脈衝效果 + 代幣圖標
 */
function SendingAnimationComponent({ token, amount }: SendingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Pulsing circle with token icon */}
      <div className="relative">
        {/* Outer pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full bg-keylio-teal/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-keylio-teal/20"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
        />

        {/* Center icon */}
        <motion.div
          className="relative w-20 h-20 rounded-full bg-keylio-bg-tertiary flex items-center justify-center"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <TokenIcon symbol={token} size="48px" />
        </motion.div>
      </div>

      {/* Text */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-keylio-text-primary">
          <Loader2 className="w-4 h-4 animate-spin text-keylio-teal" />
          <span className="font-medium">發送中</span>
        </div>
        <p className="text-sm text-keylio-text-muted">
          正在發送 {amount} {token}
        </p>
      </div>
    </div>
  );
}

export const SendingAnimation = memo(SendingAnimationComponent);
