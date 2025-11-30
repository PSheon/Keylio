"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft } from "lucide-react";
import { SwapDialog } from "@/components/transaction/SwapDialog";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { fadeInUp, staggerContainer } from "@/lib/animations";

/**
 * 兌換頁面
 * Spec: USDT ↔ USDC 兌換
 */
function SwapPage() {
  return (
    <DashboardLayout>
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-keylio-text-primary">兌換幣種</h1>
        <p className="text-sm text-keylio-text-muted mt-1">
          在穩定幣之間快速兌換，零手續費
        </p>
      </motion.div>

      {/* Swap Card */}
      <motion.div
        variants={fadeInUp}
        className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-6"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-keylio-text-primary mb-2">
            穩定幣兌換
          </h2>
          <p className="text-sm text-keylio-text-muted text-center mb-6 max-w-xs">
            支援 USDT 與 USDC 之間的即時兌換，享受 Plasma 網路零手續費優勢
          </p>

          <SwapDialog
            trigger={
              <button className="px-8 py-3 bg-keylio-teal hover:bg-keylio-teal/90 text-white rounded-full font-medium transition-colors">
                開始兌換
              </button>
            }
          />
        </div>
      </motion.div>

      {/* Info Cards */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-4">
          <h3 className="font-medium text-keylio-text-primary mb-2">💰 零手續費</h3>
          <p className="text-sm text-keylio-text-muted">
            Plasma 網路優化，穩定幣兌換無需支付任何手續費
          </p>
        </div>

        <div className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-4">
          <h3 className="font-medium text-keylio-text-primary mb-2">⚡ 即時確認</h3>
          <p className="text-sm text-keylio-text-muted">
            秒級交易確認，無需等待區塊確認
          </p>
        </div>
      </motion.div>
    </motion.div>
    </DashboardLayout>
  );
}

export default memo(SwapPage);
