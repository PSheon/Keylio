"use client";

import { memo } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/useSettingsStore";

const THEME_OPTIONS = [
  { value: "light", label: "明亮", icon: Sun },
  { value: "dark", label: "黑暗", icon: Moon },
  { value: "system", label: "跟隨系統", icon: Monitor },
] as const;

/**
 * 系統風格設定
 * 使用 Select 控件，支援明亮/黑暗/跟隨系統
 */
function ThemeSettingsComponent() {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <Monitor className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <Label className="text-base text-keylio-text-primary font-medium">系統風格</Label>
          <p className="text-[13px] text-keylio-text-muted/70">選擇主題顏色</p>
        </div>
      </div>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger className="w-[120px] h-10 bg-keylio-bg-tertiary border-2 border-keylio-border-primary text-keylio-text-primary rounded-lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <SelectItem
              key={value}
              value={value}
              className="text-keylio-text-primary focus:bg-keylio-bg-tertiary focus:text-keylio-text-primary"
            >
              <span className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const ThemeSettings = memo(ThemeSettingsComponent);
