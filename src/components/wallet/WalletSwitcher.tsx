"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronDown,
  Plus,
  Check,
  Copy,
  Wallet,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/stores/useWalletStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import db from "@/lib/storage/db";
import { deriveAddressFromXpub } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import type { SubWallet } from "@/lib/storage/db";

// ============================================================================
// Constants
// ============================================================================

const EMOJI_OPTIONS = ["💼", "💰", "🏦", "🏠", "🚗", "✈️", "🎮", "🛒", "🎯", "💎"];
const COLOR_OPTIONS = ["#14b8a6", "#3b82f6", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];

// ============================================================================
// Helper Components
// ============================================================================

interface WalletAvatarProps {
  emoji: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

function WalletAvatar({ emoji, color, size = "md" }: WalletAvatarProps) {
  const sizeClasses = {
    sm: "w-7 h-7 text-sm",
    md: "w-10 h-10 text-lg",
    lg: "w-20 h-20 text-4xl border-2",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0",
        sizeClasses[size]
      )}
      style={{ 
        backgroundColor: `${color}20`,
        ...(size === "lg" && { borderColor: color })
      }}
    >
      {emoji}
    </div>
  );
}

interface WalletListItemProps {
  wallet: SubWallet;
  isActive: boolean;
  isCopied: boolean;
  onSelect: () => void;
  onCopy: (e: React.MouseEvent) => void;
  onMore?: (e: React.MouseEvent) => void;
}

function WalletListItem({ 
  wallet, 
  isActive, 
  isCopied,
  onSelect, 
  onCopy,
  onMore 
}: WalletListItemProps) {
  const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect();
        }
      }}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
        isActive
          ? "bg-keylio-teal/10 border border-keylio-teal/30"
          : "hover:bg-keylio-bg-tertiary"
      )}
    >
      <WalletAvatar emoji={wallet.emoji} color={wallet.color} />
      
      <div className="flex-1 text-left min-w-0">
        <div className="font-medium text-keylio-text-primary truncate">
          {wallet.name}
        </div>
        <div className="text-xs text-keylio-text-muted font-mono">
          {shortAddress}
        </div>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onCopy}
          className="p-2 hover:bg-keylio-bg-primary rounded-lg transition-colors"
          aria-label="複製地址"
        >
          {isCopied ? (
            <Check className="size-4 text-keylio-teal" />
          ) : (
            <Copy className="size-4 text-keylio-text-muted" />
          )}
        </button>
        
        {onMore && (
          <button
            onClick={onMore}
            className="p-2 hover:bg-keylio-bg-primary rounded-lg transition-colors"
            aria-label="更多選項"
          >
            <MoreHorizontal className="size-4 text-keylio-text-muted" />
          </button>
        )}
        
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-keylio-teal ml-1" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function WalletSwitcher() {
  const [isListOpen, setIsListOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { wallets, activeWalletId, setActiveWallet, addWallet } = useWalletStore(
    useShallow((state) => ({
      wallets: state.wallets,
      activeWalletId: state.activeWalletId,
      setActiveWallet: state.setActiveWallet,
      addWallet: state.addWallet,
    }))
  );

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  );

  const handleSelectWallet = useCallback((wallet: SubWallet) => {
    if (wallet.id) {
      setActiveWallet(wallet.id);
      setIsListOpen(false);
      toast.success(`已切換至 ${wallet.name}`);
    }
  }, [setActiveWallet]);

  const handleCopyAddress = useCallback((e: React.MouseEvent, wallet: SubWallet) => {
    e.stopPropagation();
    navigator.clipboard.writeText(wallet.address);
    setCopiedId(wallet.id ?? null);
    toast.success("地址已複製");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCreateWallet = useCallback(async () => {
    if (!newWalletName.trim()) {
      toast.error("請輸入錢包名稱");
      return;
    }

    setIsCreating(true);
    try {
      const xpubSetting = await db.settings.get({ key: "xpub" });
      const nextIndex = wallets.length;

      let newAddress: string;

      if (xpubSetting?.value) {
        newAddress = deriveAddressFromXpub(xpubSetting.value as string, nextIndex);
      } else {
        toast.error("無法派生新地址，請重新設置錢包");
        setIsCreating(false);
        return;
      }

      const newWallet: Omit<SubWallet, "id"> = {
        name: newWalletName.trim(),
        address: newAddress,
        index: nextIndex,
        color: selectedColor,
        emoji: selectedEmoji,
        createdAt: Date.now(),
      };

      const id = await db.sub_wallets.add(newWallet);
      addWallet({ ...newWallet, id });

      toast.success("子錢包創建成功");
      setIsCreateOpen(false);
      setNewWalletName("");
      setSelectedEmoji(EMOJI_OPTIONS[0]);
      setSelectedColor(COLOR_OPTIONS[0]);
    } catch (error) {
      console.error("Create wallet error:", error);
      toast.error("創建失敗");
    } finally {
      setIsCreating(false);
    }
  }, [newWalletName, selectedColor, selectedEmoji, wallets.length, addWallet]);

  const handleWalletMore = useCallback((e: React.MouseEvent, wallet: SubWallet) => {
    e.stopPropagation();
    // TODO: Show menu with edit/delete options
    toast.info(`${wallet.name} 的更多選項`);
  }, []);

  return (
    <>
      {/* Wallet Switcher Button */}
      <button
        onClick={() => setIsListOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-keylio-bg-tertiary/50 hover:bg-keylio-bg-tertiary border border-keylio-border transition-all group"
      >
        {activeWallet ? (
          <>
            <WalletAvatar 
              emoji={activeWallet.emoji} 
              color={activeWallet.color} 
              size="sm" 
            />
            <span className="text-sm font-medium text-keylio-text-primary max-w-[100px] truncate">
              {activeWallet.name}
            </span>
          </>
        ) : (
          <>
            <Wallet className="size-5 text-keylio-text-muted" />
            <span className="text-sm text-keylio-text-muted">選擇錢包</span>
          </>
        )}
        <ChevronDown className="size-4 text-keylio-text-muted group-hover:text-keylio-text-secondary transition-colors" />
      </button>

      {/* Wallet List Dialog (unified with Dialog component) */}
      <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
        <DialogContent size="md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>我的錢包</DialogTitle>
            <DialogDescription>
              {wallets.length} 個子錢包
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="max-h-[300px] overflow-y-auto -mx-2 px-2">
            {wallets.map((wallet) => (
              <WalletListItem
                key={wallet.id}
                wallet={wallet}
                isActive={wallet.id === activeWalletId}
                isCopied={copiedId === wallet.id}
                onSelect={() => handleSelectWallet(wallet)}
                onCopy={(e) => handleCopyAddress(e, wallet)}
                onMore={(e) => handleWalletMore(e, wallet)}
              />
            ))}
          </DialogBody>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsListOpen(false);
                setIsCreateOpen(true);
              }}
              variant="outline"
              className="w-full h-11 gap-2 border-keylio-border text-keylio-text-primary hover:bg-keylio-bg-tertiary"
            >
              <Plus className="size-4" />
              新增子錢包
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Wallet Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>創建子錢包</DialogTitle>
            <DialogDescription>
              為不同用途創建獨立的子錢包，方便管理資產
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {/* Preview */}
            <div className="flex justify-center py-2">
              <WalletAvatar 
                emoji={selectedEmoji} 
                color={selectedColor} 
                size="lg" 
              />
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label>錢包名稱</Label>
              <Input
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="例如：生活開銷"
                className="bg-keylio-bg-primary border-keylio-border"
                maxLength={20}
              />
            </div>

            {/* Emoji Picker */}
            <div className="space-y-2">
              <Label>圖示</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
                      selectedEmoji === emoji
                        ? "bg-keylio-teal/20 ring-2 ring-keylio-teal"
                        : "bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>顏色</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      selectedColor === color && "ring-2 ring-offset-2 ring-offset-keylio-bg-secondary"
                    )}
                    style={{ 
                      backgroundColor: color,
                      ...(selectedColor === color && { '--tw-ring-color': color } as React.CSSProperties)
                    }}
                  />
                ))}
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              onClick={handleCreateWallet}
              disabled={isCreating || !newWalletName.trim()}
              className="w-full h-12 bg-keylio-teal hover:bg-keylio-teal/90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  創建中...
                </>
              ) : (
                "創建錢包"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
