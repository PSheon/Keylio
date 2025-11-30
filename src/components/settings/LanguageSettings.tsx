"use client";

import { memo } from "react";
import { Globe } from "lucide-react";
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

/** 語言選項 */
const LANGUAGE_OPTIONS = [
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
] as const;

/**
 * 語言設定
 * 統一使用 Select 控件
 */
function LanguageSettingsComponent() {
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const handleChange = (value: string) => {
    setLanguage(value as "zh-TW" | "en");
    const selected = LANGUAGE_OPTIONS.find((opt) => opt.value === value);
    toast.success(`語言已變更為 ${selected?.label || value}`);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <Label className="text-keylio-text-primary font-medium">語言</Label>
          <p className="text-xs text-keylio-text-muted">選擇應用程式的顯示語言</p>
        </div>
      </div>
      <Select value={language} onValueChange={handleChange}>
        <SelectTrigger className="w-[140px] bg-keylio-bg-tertiary border-keylio-border-primary text-keylio-text-primary">
          <SelectValue placeholder="選擇語言" />
        </SelectTrigger>
        <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-keylio-text-primary hover:bg-keylio-bg-tertiary cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const LanguageSettings = memo(LanguageSettingsComponent);
