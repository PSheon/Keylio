"use client";

import { memo, useState } from "react";
import { ethers } from "ethers";
import { QrCode, Users, CheckCircle, AlertTriangle, Clipboard } from "lucide-react";
import { ContactPickerDialog } from "@/components/contacts/ContactPickerDialog";
import { QRScanner, type QRContactData } from "@/components/contacts/QRScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { RecentContacts } from "../RecentContacts";
import type { SendFormData } from "../types";

interface RecipientStepProps {
  data: SendFormData;
  onUpdate: (data: Partial<SendFormData>) => void;
  onNext: () => void;
}

/**
 * Step 1: 選擇收款人
 *
 * 結構：
 * - 上半部：常用聯絡人列表 + 「聯絡人」按鈕
 * - 下半部：地址輸入框 + 貼上按鈕 + 驗證狀態
 * - QR 掃描（手機版）
 */
function RecipientStepComponent({ data, onUpdate, onNext }: RecipientStepProps) {
  const [showQRScanner, setShowQRScanner] = useState(false);

  const isValidAddress = data.recipient ? ethers.isAddress(data.recipient) : false;
  const canProceed = isValidAddress;

  const handleContactSelect = (address: string, name?: string) => {
    onUpdate({ recipient: address, recipientName: name || "" });
  };

  const handleQRScan = (result: QRContactData) => {
    onUpdate({ recipient: result.address, recipientName: result.name || "" });
    setShowQRScanner(false);
  };

  const handleAddressChange = (value: string) => {
    onUpdate({ recipient: value, recipientName: "" });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleAddressChange(text.trim());
        showSuccess("已貼上");
      }
    } catch {
      showError("無法讀取剪貼簿");
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* ========== 上半部：常用聯絡人區塊 ========== */}
      <RecentContacts
        onSelect={handleContactSelect}
        selectedAddress={data.recipient}
        maxContacts={4}
        headerAction={
          <ContactPickerDialog
            onSelect={handleContactSelect}
            trigger={
              <button
                className="flex items-center gap-1 px-2 py-1 text-xs text-keylio-text-secondary hover:text-keylio-teal hover:bg-keylio-teal/10 rounded-lg transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>全部</span>
              </button>
            }
          />
        }
      />

      {/* ========== 分隔線：或者 ========== */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-keylio-border-primary" />
        <span className="text-xs text-keylio-text-muted">或者</span>
        <div className="flex-1 h-px bg-keylio-border-primary" />
      </div>

      {/* ========== 下半部：手動輸入地址 ========== */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-keylio-text-primary">輸入收款人地址</h4>
        <div className="flex gap-2">
          {/* 地址輸入框 */}
          <div className="relative flex-1">
            <Input
              value={data.recipient}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="0x..."
              className={cn(
                "bg-keylio-bg-primary border-keylio-border-primary font-mono text-sm pr-10",
                isValidAddress && "border-green-500/50",
                data.recipient && !isValidAddress && "border-red-500/50"
              )}
            />
            {/* 驗證圖示 */}
            {data.recipient ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidAddress ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
            ) : null}
          </div>

          {/* 貼上按鈕 */}
          <Button
            variant="outline"
            size="icon"
            onClick={handlePaste}
            className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
            title="貼上地址"
          >
            <Clipboard className="w-4 h-4" />
          </Button>

          {/* QR 掃描按鈕 - 僅手機版顯示 */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowQRScanner(true)}
            className="border-keylio-border-primary hover:bg-keylio-bg-tertiary md:hidden"
            title="掃描 QR"
          >
            <QrCode className="w-4 h-4" />
          </Button>
        </div>

        {/* 驗證提示區 - 固定高度避免跳動 */}
        <div className="h-5 flex items-center">
          {data.recipient && !isValidAddress ? (
            <p className="text-xs text-red-400">地址格式不正確</p>
          ) : data.recipient && isValidAddress ? (
            <p className="text-xs text-green-400">地址有效</p>
          ) : null}
        </div>
      </div>

      {/* ========== 下一步按鈕 ========== */}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-keylio-teal hover:bg-keylio-teal/90"
      >
        下一步
      </Button>

      {/* QR Scanner Modal - 僅手機版使用 */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
}

export const RecipientStep = memo(RecipientStepComponent);
