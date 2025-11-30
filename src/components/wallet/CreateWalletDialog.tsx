"use client";

import { useState, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogBody,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import db from "@/lib/storage/db";
import { useWalletStore } from "@/stores/useWalletStore";
import { cn } from "@/lib/utils";

// ============================================================================
// Types & Constants
// ============================================================================

interface CreateWalletDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const EMOJI_OPTIONS = ["💼", "💰", "🏦", "🏠", "🚗", "✈️", "🎮", "🛒", "🎯", "💎"];
const COLOR_OPTIONS = ["#14b8a6", "#3b82f6", "#8b5cf6", "#f43f5e", "#f59e0b", "#10b981", "#ec4899", "#06b6d4"];

// ============================================================================
// Helper Components
// ============================================================================

/** Security tips banner */
function SecurityTip() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-keylio-teal/5 border border-keylio-teal/20">
      <Shield className="size-5 text-keylio-teal shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="text-keylio-teal font-medium">安全提示</p>
        <p className="text-keylio-text-secondary mt-0.5">
          子錢包共享主錢包的安全性。建議為不同用途創建獨立子錢包，方便追蹤資產。
        </p>
      </div>
    </div>
  );
}

/** Emoji picker grid */
function EmojiPicker({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (emoji: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>選擇圖示</Label>
      <div className="flex gap-2 flex-wrap">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all",
              value === e
                ? "bg-keylio-teal/20 ring-2 ring-keylio-teal"
                : "bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80"
            )}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Color picker grid */
function ColorPicker({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (color: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>選擇顏色</Label>
      <div className="flex gap-2 flex-wrap">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              "w-8 h-8 rounded-full transition-all",
              value === c && "ring-2 ring-offset-2 ring-offset-keylio-bg-secondary"
            )}
            style={{ 
              backgroundColor: c,
              ...(value === c && { '--tw-ring-color': c } as React.CSSProperties)
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function CreateWalletDialog({ trigger, onSuccess }: CreateWalletDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addWallet = useWalletStore((state) => state.addWallet);

  const resetForm = useCallback(() => {
    setName("");
    setEmoji(EMOJI_OPTIONS[0]);
    setColor(COLOR_OPTIONS[0]);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      toast.error("請輸入錢包名稱");
      return;
    }

    setIsProcessing(true);
    try {
      // Get encrypted mnemonic
      const setting = await db.settings.get({ key: 'encrypted_mnemonic' });
      if (!setting) throw new Error("No mnemonic found");

      // NOTE: In production, should use xpub to derive addresses without exposing private key
      // For demo, generate mock address
      const nextIndex = await db.sub_wallets.count();
      const mockAddress = "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");

      const newWallet = {
        name,
        address: mockAddress,
        index: nextIndex,
        color,
        emoji,
        createdAt: Date.now(),
      };

      const id = await db.sub_wallets.add(newWallet);
      addWallet({ ...newWallet, id });

      toast.success("子錢包創建成功");
      setIsOpen(false);
      resetForm();
      onSuccess?.();

    } catch (error) {
      console.error(error);
      toast.error("創建失敗");
    } finally {
      setIsProcessing(false);
    }
  }, [name, color, emoji, addWallet, resetForm, onSuccess]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  }, [resetForm]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>Create Wallet</Button>}
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>創建新的子錢包</DialogTitle>
          <DialogDescription>
            為不同用途創建獨立子錢包，方便管理資產
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Preview */}
          <div className="flex justify-center py-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
              style={{ 
                backgroundColor: `${color}20`,
                borderColor: color
              }}
            >
              {emoji}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="wallet-name">錢包名稱</Label>
            <Input
              id="wallet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-keylio-bg-primary border-keylio-border"
              placeholder="例如：儲蓄帳戶"
              maxLength={20}
              autoFocus
            />
          </div>
          
          {/* Emoji Picker */}
          <EmojiPicker value={emoji} onChange={setEmoji} />

          {/* Color Picker */}
          <ColorPicker value={color} onChange={setColor} />

          {/* Security Tip */}
          <SecurityTip />
        </DialogBody>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            className="border-keylio-border text-keylio-text-secondary hover:bg-keylio-bg-tertiary"
          >
            取消
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isProcessing || !name.trim()} 
            className="bg-keylio-teal hover:bg-keylio-teal/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                創建中...
              </>
            ) : (
              "創建"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
