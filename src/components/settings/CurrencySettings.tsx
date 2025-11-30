"use client";

import { memo } from "react";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/useSettingsStore";

/** 貨幣選項 */
const CURRENCY_OPTIONS = [
  { value: "USD", label: "美元 (USD)", symbol: "$" },
  { value: "TWD", label: "新台幣 (TWD)", symbol: "NT$" },
] as const;

/**
 * 貨幣顯示單位設定
 * 允許用戶選擇偏好的法幣顯示單位
 */
function CurrencySettingsComponent() {
  const currency = useSettingsStore((state) => state.currency);
  const setCurrency = useSettingsStore((state) => state.setCurrency);

  const handleChange = (value: string) => {
    setCurrency(value as "USD" | "TWD");
    const selected = CURRENCY_OPTIONS.find((opt) => opt.value === value);
    toast.success(`貨幣單位已變更為 ${selected?.label || value}`);
  };

  const currentOption = CURRENCY_OPTIONS.find((opt) => opt.value === currency);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <Label className="text-keylio-text-primary font-medium">
            貨幣顯示單位
          </Label>
          <p className="text-xs text-keylio-text-muted">
            選擇偏好的法幣顯示單位
          </p>
        </div>
      </div>
      <Select value={currency} onValueChange={handleChange}>
        <SelectTrigger className="w-[140px] bg-keylio-bg-tertiary border-keylio-border-primary text-keylio-text-primary">
          <SelectValue placeholder="選擇貨幣">
            {currentOption ? <span className="flex items-center gap-1.5">
                <span className="text-keylio-text-muted">{currentOption.symbol}</span>
                {currentOption.value}
              </span> : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
          {CURRENCY_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-keylio-text-primary hover:bg-keylio-bg-tertiary cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-keylio-text-muted w-8">{option.symbol}</span>
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const CurrencySettings = memo(CurrencySettingsComponent);
