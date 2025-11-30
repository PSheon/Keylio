"use client";

import { memo } from "react";
import { Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/useSettingsStore";

const HIDE_BALANCE_OPTIONS = [
  { value: "always-show", label: "永遠顯示" },
  { value: "always-hide", label: "永遠隱藏" },
  { value: "hide-on-start", label: "啟動時隱藏" },
] as const;

/**
 * 隱藏餘額設定
 * 允許用戶選擇餘額顯示模式
 */
function HideBalanceSettingsComponent() {
  const hideBalances = useSettingsStore((state) => state.hideBalances);
  const setHideBalances = useSettingsStore((state) => state.setHideBalances);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-keylio-bg-tertiary flex items-center justify-center">
          <Eye className="w-5 h-5 text-keylio-text-secondary" />
        </div>
        <div>
          <Label className="text-base text-keylio-text-primary font-medium">
            隱藏餘額
          </Label>
          <p className="text-[13px] text-keylio-text-muted/70">
            控制金額顯示方式
          </p>
        </div>
      </div>
      <Select value={hideBalances} onValueChange={setHideBalances}>
        <SelectTrigger className="w-[120px] h-10 bg-keylio-bg-tertiary border-2 border-keylio-border-primary text-keylio-text-primary rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
          {HIDE_BALANCE_OPTIONS.map(({ value, label }) => (
            <SelectItem
              key={value}
              value={value}
              className="text-keylio-text-primary focus:bg-keylio-bg-tertiary focus:text-keylio-text-primary"
            >
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const HideBalanceSettings = memo(HideBalanceSettingsComponent);
