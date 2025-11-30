"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
} from "lucide-react";
import { SendDialog } from "@/components/transaction/SendDialog";
import { ReceiveDialog } from "@/components/transaction/ReceiveDialog";
import { SwapDialog } from "@/components/transaction/SwapDialog";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuickActionGridProps {
  /** 錢包地址 */
  walletAddress: string;
  /** 是否有餘額 (用於控制 disabled 狀態) */
  hasBalance: boolean;
}

/** 操作按鈕樣式配置 */
const ACTION_STYLES = {
  primary: {
    container: "bg-keylio-teal/10 hover:bg-keylio-teal/20 border-keylio-teal/30",
    icon: "bg-keylio-teal/20",
    iconColor: "text-keylio-teal",
    labelColor: "text-keylio-teal",
  },
  send: {
    container: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
    icon: "bg-blue-500/20",
    iconColor: "text-blue-400",
    labelColor: "text-blue-400",
  },
  secondary: {
    container: "bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary border-keylio-border-primary",
    icon: "",
    iconColor: "",
    labelColor: "text-keylio-text-primary",
  },
  disabled: {
    container: "bg-keylio-bg-tertiary border-keylio-border-primary cursor-not-allowed opacity-60",
    icon: "bg-keylio-bg-secondary",
    iconColor: "text-keylio-text-muted",
    labelColor: "text-keylio-text-muted",
  },
} as const;

/**
 * Quick Action Grid
 * Spec: 4 個操作按鈕 - [💰 收款] [📤 送出] [🔄 兌換] [👥 聯絡簿]
 */
function QuickActionGridComponent({ walletAddress, hasBalance }: QuickActionGridProps) {
  const handleDisabledAction = (action: string) => {
    toast.info(`${action}需要有餘額`, {
      description: "點擊「收款」按鈕獲取資金",
    });
  };

  return (
    <motion.div
      variants={fadeInUp}
      className="grid grid-cols-3 gap-2 sm:gap-3"
    >
      {/* 收款 - 永遠可用 */}
      <ReceiveDialog
        address={walletAddress}
        trigger={
          <ActionButton
            icon={<ArrowDownToLine className="w-5 h-5 sm:w-6 sm:h-6" />}
            label="收款"
            variant="primary"
          />
        }
      />

      {/* 送出 - 需要餘額 */}
      {hasBalance ? (
        <SendDialog
          fromAddress={walletAddress}
          trigger={
            <ActionButton
              icon={<ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6" />}
              label="送出"
              variant="send"
            />
          }
        />
      ) : (
        <ActionButton
          icon={<ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6" />}
          label="送出"
          variant="disabled"
          onClick={() => handleDisabledAction("送出")}
        />
      )}

      {/* 兌換 - 需要餘額 */}
      {hasBalance ? (
        <SwapDialog
          trigger={
            <ActionButton
              icon={<ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
              label="兌換"
              variant="secondary"
              iconBg="bg-purple-500/10"
              iconColor="text-purple-400"
            />
          }
        />
      ) : (
        <ActionButton
          icon={<ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
          label="兌換"
          variant="disabled"
          onClick={() => handleDisabledAction("兌換")}
        />
      )}
    </motion.div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  variant: keyof typeof ACTION_STYLES;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
}

function ActionButton({
  icon,
  label,
  variant,
  iconBg,
  iconColor,
  onClick,
}: ActionButtonProps) {
  const styles = ACTION_STYLES[variant];
  const finalIconBg = iconBg || styles.icon;
  const finalIconColor = iconColor || styles.iconColor;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-2xl border transition-colors touch-manipulation",
        variant !== "disabled" && "active:scale-95",
        styles.container
      )}
    >
      <div
        className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
          finalIconBg
        )}
      >
        <span className={finalIconColor}>{icon}</span>
      </div>
      <span className={cn("text-[10px] sm:text-xs font-medium", styles.labelColor)}>
        {label}
      </span>
    </button>
  );
}

export const QuickActionGrid = memo(QuickActionGridComponent);
