"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// WalletAvatar - 錢包頭像元件
// ============================================================================

export type WalletAvatarSize = "sm" | "md" | "lg";

interface WalletAvatarProps {
  /** 顯示的 Emoji */
  emoji: string;
  /** 主題顏色 */
  color: string;
  /** 尺寸變體 */
  size?: WalletAvatarSize;
  /** 額外的 className */
  className?: string;
}

const SIZE_CLASSES: Record<WalletAvatarSize, string> = {
  sm: "w-7 h-7 text-sm",
  md: "w-10 h-10 text-lg",
  lg: "w-20 h-20 text-4xl border-2",
};

/**
 * 錢包頭像元件
 * 顯示 emoji 和背景顏色的圓形頭像
 */
function WalletAvatarComponent({
  emoji,
  color,
  size = "md",
  className,
}: WalletAvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        SIZE_CLASSES[size],
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        ...(size === "lg" && { borderColor: color }),
      }}
    >
      {emoji}
    </div>
  );
}

export const WalletAvatar = memo(WalletAvatarComponent);
