"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sessionManager } from "@/lib/session";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { toast } from "sonner";

const AUTO_LOCK_OPTIONS = [
  { value: "1", label: "1 分鐘" },
  { value: "5", label: "5 分鐘" },
  { value: "15", label: "15 分鐘" },
  { value: "30", label: "30 分鐘" },
  { value: "60", label: "1 小時" },
  { value: "0", label: "永不" },
];

export function AutoLockSettings() {
  const { autoLockMinutes, setAutoLockMinutes } = useSettingsStore();
  const [selectedValue, setSelectedValue] = useState(String(autoLockMinutes));

  useEffect(() => {
    setSelectedValue(String(autoLockMinutes));
  }, [autoLockMinutes]);

  const handleChange = (value: string) => {
    const minutes = parseInt(value, 10);
    setSelectedValue(value);
    setAutoLockMinutes(minutes);
    
    // Update session manager
    sessionManager.configure({ autoLockMinutes: minutes });
    
    toast.success(`自動鎖定時間已更新為 ${minutes === 0 ? '永不' : `${minutes} 分鐘`}`);
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="font-medium text-keylio-text-primary">自動鎖定</p>
          <p className="text-sm text-keylio-text-muted">閒置後自動鎖定錢包</p>
        </div>
      </div>
      <Select value={selectedValue} onValueChange={handleChange}>
        <SelectTrigger className="w-[140px] bg-keylio-bg-tertiary border-keylio-border-primary text-keylio-text-primary">
          <SelectValue placeholder="選擇時間" />
        </SelectTrigger>
        <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
          {AUTO_LOCK_OPTIONS.map((option) => (
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
