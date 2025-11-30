"use client";

import { memo, type ReactNode } from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  /** 區塊標題 */
  title: string;
  /** 區塊圖標（可選） */
  icon?: ReactNode;
  /** 區塊說明（顯示在標題旁的 tooltip） */
  description?: string;
  /** 子內容 */
  children: ReactNode;
  /** 額外的 className */
  className?: string;
}

/**
 * 設定區塊組件
 * 
 * 提供統一的區塊標題和間距樣式，用於設定頁面的分區顯示。
 * 每個區塊包含：
 * - 區塊標題（帶可選圖標）
 * - 可選的說明 tooltip
 * - 子內容區域
 */
function SettingsSectionComponent({
  title,
  icon,
  description,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {/* 區塊標題 */}
      <div className="flex items-center gap-2">
        {icon && (
          <span className="text-keylio-teal">{icon}</span>
        )}
        <h3 className="text-sm font-semibold text-keylio-text-secondary uppercase tracking-wider">
          {title}
        </h3>
        {description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5 hover:bg-keylio-bg-tertiary rounded transition-colors">
                  <Info className="w-3.5 h-3.5 text-keylio-text-muted" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p className="text-xs">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* 區塊內容 */}
      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}

export const SettingsSection = memo(SettingsSectionComponent);
