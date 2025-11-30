"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WalletSwitcher } from "@/components/wallet/WalletSwitcher";
import { fadeInUp } from "@/lib/animations";

interface PortfolioHeaderProps {
  /** 是否正在刷新 */
  isRefreshing: boolean;
  /** 刷新回調 */
  onRefresh: () => void;
}

/**
 * Portfolio 頁面 Header
 * 包含錢包切換器和刷新按鈕
 */
function PortfolioHeaderComponent({ isRefreshing, onRefresh }: PortfolioHeaderProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex items-center justify-between"
    >
      <WalletSwitcher />

      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="h-9 w-9 p-0 hover:bg-keylio-bg-tertiary"
      >
        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
      </Button>
    </motion.div>
  );
}

export const PortfolioHeader = memo(PortfolioHeaderComponent);
