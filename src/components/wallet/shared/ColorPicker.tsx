"use client";

import { memo } from "react";
import { WALLET_COLOR_OPTIONS } from "@/constants";
import { cn } from "@/lib/utils";

// ============================================================================
// ColorPicker - 顏色選擇器元件
// ============================================================================

interface ColorPickerProps {
  /** 當前選中的顏色 */
  value: string;
  /** 選擇變更回調 */
  onChange: (color: string) => void;
  /** 額外的 className */
  className?: string;
}

/**
 * 顏色選擇器
 * 用於選擇錢包主題顏色
 */
function ColorPickerComponent({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {WALLET_COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "w-8 h-8 rounded-full transition-all",
            value === color &&
              "ring-2 ring-offset-2 ring-offset-keylio-bg-secondary"
          )}
          style={{
            backgroundColor: color,
            ...(value === color &&
              ({ "--tw-ring-color": color } as React.CSSProperties)),
          }}
        />
      ))}
    </div>
  );
}

export const ColorPicker = memo(ColorPickerComponent);
