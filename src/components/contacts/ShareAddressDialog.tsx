"use client";

import { useState } from "react";
import { Copy, Share2, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/lib/toast";
import { useWalletStore } from "@/stores/useWalletStore";
import { ContactQRCode } from "./ContactQRCode";

interface ShareAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 分享我的地址對話框
 * Spec: 用戶可以分享自己的錢包地址給朋友
 * 功能: QR Code 顯示、複製地址、系統分享
 */
export function ShareAddressDialog({ open, onOpenChange }: ShareAddressDialogProps) {
  const [copied, setCopied] = useState(false);

  // 從錢包 store 取得當前地址
  const getCurrentWallet = useWalletStore((state) => state.getCurrentWallet);
  const currentWallet = getCurrentWallet();

  const address = currentWallet?.address || "";
  const walletName = currentWallet?.name || "我的錢包";

  // 複製地址到剪貼簿
  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      showSuccess("地址已複製到剪貼簿");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("複製失敗", "請手動複製");
    }
  };

  // 使用系統分享功能
  const handleShare = async () => {
    if (!address) return;

    const shareData = {
      title: "Keylio 錢包地址",
      text: `${walletName}\n${address}`,
      // 如果有 deeplink 可加入 url
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showSuccess("已開啟分享選單");
      } catch (error) {
        // 用戶取消分享不算錯誤
        if ((error as Error).name !== "AbortError") {
          showError("分享失敗");
        }
      }
    } else {
      // 不支援 Web Share API，改用複製
      handleCopy();
    }
  };

  if (!address) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>分享地址</DialogTitle>
            <DialogDescription>
              請先建立或解鎖錢包
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            分享我的地址
          </DialogTitle>
          <DialogDescription>
            讓朋友掃描 QR Code 或複製地址來加入聯絡人
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <ContactQRCode
              address={address}
              name={walletName}
              size={200}
              className="shadow-lg"
            />
          </div>

          {/* 錢包名稱 */}
          <div className="text-center">
            <p className="font-medium text-lg">{walletName}</p>
          </div>

          {/* 地址顯示 */}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-1">錢包地址</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  已複製
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  複製地址
                </>
              )}
            </Button>

            <Button
              className="flex-1"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
