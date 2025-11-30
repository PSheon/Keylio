"use client";

import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** 預設金額選項 */
const THRESHOLD_OPTIONS = [100, 500, 1000, 2500, 5000, 10000];

/**
 * 大額轉帳警告門檻設定
 * 使用 Select 控件，提供預設金額選項
 */
function LargeTransferSettingsComponent() {
  const threshold = useSettingsStore((state) => state.largeTransferThreshold);
  const setThreshold = useSettingsStore((state) => state.setLargeTransferThreshold);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <Label className="text-base text-keylio-text-primary font-medium">
            大額警告
          </Label>
          <p className="text-[13px] text-keylio-text-muted/70">
            超額時顯示確認
          </p>
        </div>
      </div>
      <Select
        value={threshold.toString()}
        onValueChange={(val) => setThreshold(Number(val))}
      >
        <SelectTrigger className="w-[110px] h-10 bg-keylio-bg-tertiary border-2 border-keylio-border-primary text-keylio-text-primary rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
          {THRESHOLD_OPTIONS.map((amount) => (
            <SelectItem
              key={amount}
              value={amount.toString()}
              className="text-keylio-text-primary focus:bg-keylio-bg-tertiary focus:text-keylio-text-primary"
            >
              {formatCurrency(amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const LargeTransferSettings = memo(LargeTransferSettingsComponent);
