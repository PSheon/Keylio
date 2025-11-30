"use client";

import { memo } from "react";
import { WALLET_EMOJI_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";

// ============================================================================
// EmojiPicker - Emoji 選擇器元件
// ============================================================================

interface EmojiPickerProps {
  /** 當前選中的 emoji */
  value: string;
  /** 選擇變更回調 */
  onChange: (emoji: string) => void;
  /** 額外的 className */
  className?: string;
}

/**
 * Emoji 選擇器
 * 用於選擇錢包圖示
 */
function EmojiPickerComponent({ value, onChange, className }: EmojiPickerProps) {
  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {WALLET_EMOJI_OPTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
            value === emoji
              ? "bg-keylio-teal/20 ring-2 ring-keylio-teal"
              : "bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export const EmojiPicker = memo(EmojiPickerComponent);
