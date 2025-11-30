"use client";

import { useState, useCallback, memo } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi,
  CheckCircle,
  AlertCircle,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { fadeInUp } from "@/lib/animations";
import { showSuccess, showError } from "@/lib/toast";
import { useWalletStore } from "@/stores/useWalletStore";

interface NFCDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReceive: (data: NFCContactData) => void;
  mode: "send" | "receive";
}

export interface NFCContactData {
  type: "keylio_contact";
  address: string;
  name?: string;
  chainId?: string;
}

type NFCState = "idle" | "waiting" | "success" | "error" | "unsupported";

/**
 * NFC 通訊對話框
 * Spec: 使用 Web NFC API 交換聯絡人資訊
 * 注意: Web NFC 目前僅支援 Android Chrome
 */
function NFCDialogComponent({ isOpen, onClose, onReceive, mode }: NFCDialogProps) {
  const [nfcState, setNfcState] = useState<NFCState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [receivedData, setReceivedData] = useState<NFCContactData | null>(null);

  // 取得當前錢包資訊（用於發送模式）
  const getCurrentWallet = useWalletStore((state) => state.getCurrentWallet);
  const currentWallet = getCurrentWallet();

  // 檢查 NFC 支援
  const checkNFCSupport = useCallback((): boolean => {
    if (!('NDEFReader' in window)) {
      setNfcState("unsupported");
      setErrorMessage("此裝置或瀏覽器不支援 NFC 功能。Web NFC 目前僅支援 Android Chrome。");
      return false;
    }
    return true;
  }, []);

  // 開始 NFC 讀取（接收模式）
  const startReceiving = useCallback(async () => {
    if (!checkNFCSupport()) return;

    try {
      setNfcState("waiting");

      // @ts-expect-error - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.addEventListener("reading", ({ message }: { message: { records: Array<{ recordType: string; data: ArrayBuffer }> } }) => {
        for (const record of message.records) {
          if (record.recordType === "text") {
            const decoder = new TextDecoder();
            const text = decoder.decode(record.data);

            try {
              const data = JSON.parse(text);
              if (data.type === "keylio_contact" && data.address) {
                // 驗證地址
                ethers.getAddress(data.address);
                setReceivedData(data);
                setNfcState("success");
                return;
              }
            } catch {
              // 嘗試純地址格式
              try {
                const address = ethers.getAddress(text.trim());
                setReceivedData({
                  type: "keylio_contact",
                  address,
                });
                setNfcState("success");
                return;
              } catch {
                // 無效資料
              }
            }
          }
        }

        showError("讀取到無效的 NFC 資料");
      });

      ndef.addEventListener("readingerror", () => {
        setNfcState("error");
        setErrorMessage("NFC 讀取失敗，請重試");
      });

    } catch (error: unknown) {
      console.error("NFC scan error:", error);
      setNfcState("error");

      const errorObj = error as { name?: string; message?: string };
      if (errorObj.name === "NotAllowedError") {
        setErrorMessage("請允許 NFC 權限");
      } else if (errorObj.name === "NotSupportedError") {
        setErrorMessage("此裝置不支援 NFC");
      } else {
        setErrorMessage("NFC 啟動失敗: " + (errorObj.message || "未知錯誤"));
      }
    }
  }, [checkNFCSupport]);

  // 開始 NFC 寫入（發送模式）
  const startSending = useCallback(async () => {
    if (!checkNFCSupport()) return;
    if (!currentWallet?.address) {
      showError("請先建立或解鎖錢包");
      return;
    }

    try {
      setNfcState("waiting");

      const contactData: NFCContactData = {
        type: "keylio_contact",
        address: currentWallet.address,
        name: currentWallet.name,
        chainId: "plasma_mainnet",
      };

      // @ts-expect-error - NDEFReader is not in TypeScript types yet
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "text",
            data: JSON.stringify(contactData),
          },
        ],
      });

      setNfcState("success");
      showSuccess("已成功寫入 NFC");

    } catch (error: unknown) {
      console.error("NFC write error:", error);
      setNfcState("error");

      const errorObj = error as { name?: string; message?: string };
      if (errorObj.name === "NotAllowedError") {
        setErrorMessage("請允許 NFC 權限");
      } else if (errorObj.name === "NotSupportedError") {
        setErrorMessage("此裝置不支援 NFC 寫入");
      } else {
        setErrorMessage("NFC 寫入失敗: " + (errorObj.message || "未知錯誤"));
      }
    }
  }, [checkNFCSupport, currentWallet]);

  // 關閉對話框 - 必須在 handleConfirm 前宣告
  const handleClose = useCallback(() => {
    setNfcState("idle");
    setReceivedData(null);
    setErrorMessage("");
    onClose();
  }, [onClose]);

  // 開始 NFC 操作
  const handleStart = useCallback(() => {
    if (mode === "receive") {
      startReceiving();
    } else {
      startSending();
    }
  }, [mode, startReceiving, startSending]);

  // 確認接收的聯絡人
  const handleConfirm = useCallback(() => {
    if (receivedData) {
      onReceive(receivedData);
      handleClose();
    }
  }, [receivedData, onReceive, handleClose]);

  // 重試
  const handleRetry = useCallback(() => {
    setNfcState("idle");
    setErrorMessage("");
    setReceivedData(null);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="text-keylio-text-primary flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-purple-400" />
              {mode === "receive" ? "接收聯絡人" : "分享我的地址"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-keylio-text-muted">
            {mode === "receive"
              ? "將手機靠近對方的裝置以接收聯絡人資訊"
              : "將手機靠近對方的裝置以分享你的地址"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <AnimatePresence mode="wait">
            {/* Idle State */}
            {nfcState === "idle" && (
              <motion.div
                key="idle"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-keylio-text-secondary mb-6">
                  {mode === "receive"
                    ? "準備好接收後，點擊開始按鈕"
                    : "準備好分享後，點擊開始按鈕"}
                </p>
                <Button
                  onClick={handleStart}
                  className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
                >
                  開始
                </Button>
              </motion.div>
            )}

            {/* Waiting State */}
            {nfcState === "waiting" && (
              <motion.div
                key="waiting"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center relative">
                  <Wifi className="w-10 h-10 text-purple-400" />
                  {/* Pulse animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-purple-400"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <p className="text-keylio-text-primary font-medium mb-2">
                  {mode === "receive" ? "等待讀取 NFC..." : "等待寫入 NFC..."}
                </p>
                <p className="text-sm text-keylio-text-muted mb-6">
                  請將手機靠近對方的裝置
                </p>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-keylio-border-primary"
                >
                  取消
                </Button>
              </motion.div>
            )}

            {/* Unsupported State */}
            {nfcState === "unsupported" && (
              <motion.div
                key="unsupported"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-keylio-text-primary font-medium mb-2">
                  NFC 不支援
                </p>
                <p className="text-sm text-keylio-text-muted mb-6 max-w-xs mx-auto">
                  {errorMessage}
                </p>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="border-keylio-border-primary"
                >
                  了解
                </Button>
              </motion.div>
            )}

            {/* Error State */}
            {nfcState === "error" && (
              <motion.div
                key="error"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-keylio-text-primary font-medium mb-2">
                  操作失敗
                </p>
                <p className="text-sm text-keylio-text-muted mb-6">
                  {errorMessage}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="border-keylio-border-primary"
                  >
                    關閉
                  </Button>
                  <Button
                    onClick={handleRetry}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    重試
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Success State - Receive Mode */}
            {nfcState === "success" && mode === "receive" && receivedData ? <motion.div
                key="success-receive"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-keylio-text-primary font-medium mb-4">
                  成功接收！
                </p>

                <div className="bg-keylio-bg-tertiary rounded-xl p-4 mb-6 text-left">
                  {receivedData.name ? <div className="mb-2">
                      <p className="text-xs text-keylio-text-muted">名稱</p>
                      <p className="text-keylio-text-primary font-medium">
                        {receivedData.name}
                      </p>
                    </div> : null}
                  <div>
                    <p className="text-xs text-keylio-text-muted">地址</p>
                    <p className="text-keylio-text-primary font-mono text-sm break-all">
                      {receivedData.address}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-keylio-border-primary"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 bg-keylio-teal hover:bg-keylio-teal/90"
                  >
                    新增聯絡人
                  </Button>
                </div>
              </motion.div> : null}

            {/* Success State - Send Mode */}
            {nfcState === "success" && mode === "send" && (
              <motion.div
                key="success-send"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-keylio-text-primary font-medium mb-2">
                  分享成功！
                </p>
                <p className="text-sm text-keylio-text-muted mb-6">
                  對方已收到你的地址資訊
                </p>
                <Button
                  onClick={handleClose}
                  className="bg-keylio-teal hover:bg-keylio-teal/90 min-w-[120px]"
                >
                  完成
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const NFCDialog = memo(NFCDialogComponent);
export default NFCDialog;
