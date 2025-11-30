"use client";

import { useState, useCallback } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletAvatar, EmojiPicker, ColorPicker } from "@/components/wallet/shared";
import { DEFAULT_WALLET_EMOJI, DEFAULT_WALLET_COLOR } from "@/constants";
import db from "@/lib/storage/db";
import { showSuccess, showError } from "@/lib/toast";
import { useWalletStore } from "@/stores/useWalletStore";

// ============================================================================
// Types & Constants
// ============================================================================

interface CreateWalletDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

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

// ============================================================================
// Main Component
// ============================================================================

export function CreateWalletDialog({ trigger, onSuccess }: CreateWalletDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>(DEFAULT_WALLET_EMOJI);
  const [color, setColor] = useState<string>(DEFAULT_WALLET_COLOR);
  const [isProcessing, setIsProcessing] = useState(false);

  const addWallet = useWalletStore((state) => state.addWallet);

  const resetForm = useCallback(() => {
    setName("");
    setEmoji(DEFAULT_WALLET_EMOJI);
    setColor(DEFAULT_WALLET_COLOR);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      showError("請輸入錢包名稱");
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

      showSuccess("子錢包創建成功", `${emoji} ${name} 已新增`);
      setIsOpen(false);
      resetForm();
      onSuccess?.();

    } catch (error) {
      console.error(error);
      showError("創建失敗", "請稍後重試");
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
            <WalletAvatar emoji={emoji} color={color} size="lg" />
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
          <div className="space-y-2">
            <Label>選擇圖示</Label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>選擇顏色</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

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
