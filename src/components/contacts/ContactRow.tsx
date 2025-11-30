"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Edit,
  Trash2,
  Star,
  Clock,
  User,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Contact } from "@/lib/storage/db";

/** ContactRow 變體 */
export type ContactRowVariant = "default" | "compact" | "picker";

interface ContactRowProps {
  /** 聯絡人資料 */
  contact: Contact;
  /** 顯示變體 */
  variant?: ContactRowVariant;
  /** 是否已收藏 */
  isFavorite?: boolean;
  /** 點擊時觸發（picker 模式用） */
  onClick?: () => void;
  /** 發送按鈕點擊 */
  onSend?: (contact: Contact) => void;
  /** 編輯按鈕點擊 */
  onEdit?: (contact: Contact) => void;
  /** 刪除按鈕點擊 */
  onDelete?: (contact: Contact) => void;
  /** 收藏/取消收藏 */
  onToggleFavorite?: (contact: Contact) => void;
  /** 是否選中狀態（picker 模式用） */
  isSelected?: boolean;
}

/**
 * 統一聯絡人行元件
 * 支援三種變體：
 * - default: 聯絡簿主頁完整版
 * - compact: 緊湊版（用於側欄或小空間）
 * - picker: 選擇器模式（點擊選中）
 */
function ContactRowComponent({
  contact,
  variant = "default",
  isFavorite = false,
  onClick,
  onSend,
  onEdit,
  onDelete,
  onToggleFavorite,
  isSelected = false,
}: ContactRowProps) {
  const shortAddress = `${contact.address.slice(0, 6)}...${contact.address.slice(-4)}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(contact.address);
    toast.success("地址已複製");
  };

  // Picker 模式：整行可點擊
  if (variant === "picker") {
    return (
      <motion.button
        variants={staggerItem}
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
          "border",
          isSelected
            ? "bg-keylio-teal/10 border-keylio-teal"
            : "bg-keylio-bg-primary border-keylio-border-primary hover:border-keylio-teal/50"
        )}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-keylio-bg-tertiary flex items-center justify-center text-lg shrink-0">
          {contact.emoji || <User className="w-5 h-5 text-keylio-text-muted" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-keylio-text-primary flex items-center gap-1.5">
            {contact.name}
            {isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
          </div>
          <div className="text-xs text-keylio-text-muted font-mono truncate">
            {shortAddress}
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-keylio-teal flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </motion.button>
    );
  }

  // Compact 模式
  if (variant === "compact") {
    return (
      <motion.div
        variants={staggerItem}
        className="flex items-center gap-2 p-2 rounded-lg bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-keylio-bg-tertiary flex items-center justify-center text-sm">
          {contact.emoji || <User className="w-4 h-4 text-keylio-text-muted" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-keylio-text-primary truncate">
            {contact.name}
          </div>
          <div className="text-xs text-keylio-text-muted font-mono">
            {shortAddress}
          </div>
        </div>

        {/* Actions */}
        {onSend && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSend(contact)}
            className="h-7 w-7 p-0 text-keylio-teal hover:text-keylio-teal hover:bg-keylio-teal/10"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        )}
      </motion.div>
    );
  }

  // Default 模式：完整版
  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center justify-between p-4 bg-keylio-bg-secondary hover:bg-keylio-bg-tertiary rounded-2xl border border-keylio-border-primary transition-colors group"
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-keylio-bg-tertiary flex items-center justify-center text-xl relative">
          {contact.emoji || <User className="w-6 h-6 text-keylio-text-muted" />}
          {isFavorite && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="font-medium text-keylio-text-primary flex items-center gap-2">
            {contact.name}
            {contact.label && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-keylio-bg-tertiary text-keylio-text-muted">
                {contact.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-keylio-text-muted font-mono">
              {shortAddress}
            </span>
            <button
              onClick={handleCopyAddress}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-3 h-3 text-keylio-text-muted hover:text-keylio-teal" />
            </button>
          </div>
          {contact.lastUsed && (
            <div className="text-xs text-keylio-text-muted flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {getTimeAgo(contact.lastUsed)}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Send Button */}
        {onSend && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSend(contact)}
            className="h-9 w-9 p-0 text-keylio-teal hover:text-keylio-teal hover:bg-keylio-teal/10"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-keylio-text-secondary hover:text-keylio-text-primary"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-keylio-bg-secondary border-keylio-border-primary"
          >
            {onToggleFavorite && (
              <DropdownMenuItem
                onClick={() => onToggleFavorite(contact)}
                className="text-keylio-text-primary hover:bg-keylio-bg-tertiary cursor-pointer"
              >
                <Star className={cn("w-4 h-4 mr-2", isFavorite && "text-amber-400 fill-amber-400")} />
                {isFavorite ? "取消收藏" : "加入收藏"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleCopyAddress}
              className="text-keylio-text-primary hover:bg-keylio-bg-tertiary cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-2" />
              複製地址
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem
                onClick={() => onEdit(contact)}
                className="text-keylio-text-primary hover:bg-keylio-bg-tertiary cursor-pointer"
              >
                <Edit className="w-4 h-4 mr-2" />
                編輯
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-keylio-border-primary" />
                <DropdownMenuItem
                  onClick={() => onDelete(contact)}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  刪除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

/** 格式化時間差 */
function getTimeAgo(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 週前`;
  return `${Math.floor(days / 30)} 月前`;
}

export const ContactRow = memo(ContactRowComponent);
