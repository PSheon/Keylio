"use client";

import { memo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { User, Star, CheckCircle, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import db from "@/lib/storage/db";
import { cn } from "@/lib/utils";

interface RecentContactsProps {
  onSelect: (address: string, name: string) => void;
  selectedAddress?: string;
  /** 最多顯示幾個聯絡人 */
  maxContacts?: number;
  /** 標題右側的操作按鈕 */
  headerAction?: React.ReactNode;
}

/**
 * 常用聯絡人列表
 * 使用專案列表 UI 樣式（divide-y borders）
 */
function RecentContactsComponent({
  onSelect,
  selectedAddress,
  maxContacts = 5,
  headerAction
}: RecentContactsProps) {
  // 取得所有聯絡人，按 lastUsed 排序（有使用過的優先，其次按名稱）
  const recentContacts = useLiveQuery(
    async () => {
      const allContacts = await db.contacts.toArray();

      // 排序：收藏 > 最近使用 > 名稱
      return allContacts
        .sort((a, b) => {
          // 優先顯示收藏的
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          // 其次按 lastUsed 排序
          if (a.lastUsed && b.lastUsed) return b.lastUsed - a.lastUsed;
          if (a.lastUsed && !b.lastUsed) return -1;
          if (!a.lastUsed && b.lastUsed) return 1;
          // 最後按名稱排序
          return a.name.localeCompare(b.name);
        })
        .slice(0, maxContacts);
    },
    [maxContacts]
  );

  // 空狀態：沒有聯絡人
  if (!recentContacts || recentContacts.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-keylio-text-primary">常用聯絡人</h4>
          {headerAction}
        </div>
        <div className="rounded-lg border border-dashed border-keylio-border-primary bg-keylio-bg-primary/50 p-6 text-center">
          <User className="w-8 h-8 text-keylio-text-muted mx-auto mb-2" />
          <p className="text-sm text-keylio-text-muted">還沒有常用聯絡人</p>
          <p className="text-xs text-keylio-text-muted mt-1">點擊右上角按鈕瀏覽或新增聯絡人</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-keylio-text-primary">常用聯絡人</h4>
        {headerAction}
      </div>
      <div className="rounded-lg border border-keylio-border-primary bg-keylio-bg-primary overflow-hidden">
        <div className="divide-y divide-keylio-border-primary max-h-[200px] overflow-y-auto">
          {recentContacts.map((contact) => {
            const isSelected = selectedAddress?.toLowerCase() === contact.address.toLowerCase();
            const initials = contact.name.slice(0, 2).toUpperCase();

            // 計算最後使用時間的友善顯示
            const lastUsedText = contact.lastUsed
              ? formatRelativeTime(contact.lastUsed)
              : null;

            return (
              <button
                key={contact.id}
                onClick={() => onSelect(contact.address, contact.name)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
                  isSelected
                    ? "bg-keylio-teal/10"
                    : "hover:bg-keylio-bg-tertiary"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                    isSelected
                      ? "bg-keylio-teal text-white"
                      : "bg-keylio-bg-tertiary text-keylio-text-secondary"
                  )}
                >
                  {initials || <User className="w-4 h-4" />}
                </div>

                {/* Name + Address + Last Used */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-keylio-text-primary truncate">
                      {contact.name}
                    </span>
                    {contact.isFavorite ? (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-keylio-text-muted font-mono truncate">
                      {contact.address.slice(0, 8)}...{contact.address.slice(-6)}
                    </p>
                    {lastUsedText ? (
                      <span className="text-[10px] text-keylio-text-muted flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {lastUsedText}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected ? (
                  <CheckCircle className="w-5 h-5 text-keylio-teal shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const RecentContacts = memo(RecentContactsComponent);
