"use client";

import { useState, useEffect, useRef, memo, useCallback } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fadeInUp } from "@/lib/animations";
import type { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: QRContactData) => void;
}

export interface QRContactData {
  type: "keylio_contact";
  address: string;
  name?: string;
  chainId?: string;
}

type ScanState = "initializing" | "scanning" | "success" | "error";

/**
 * QR Code 掃描器
 * Spec: 掃描朋友分享的 QR Code，自動導入地址
 * 使用 html5-qrcode 實現相機掃描
 */
function QRScannerComponent({ isOpen, onClose, onScan }: QRScannerProps) {
  const [scanState, setScanState] = useState<ScanState>("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [scannedData, setScannedData] = useState<QRContactData | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Parse QR code data
  const parseQRData = useCallback((decodedText: string): QRContactData | null => {
    try {
      // Try JSON format first (Keylio format)
      const jsonData = JSON.parse(decodedText);
      if (jsonData.type === "keylio_contact" && jsonData.address) {
        // Validate address
        ethers.getAddress(jsonData.address);
        return jsonData;
      }
    } catch {
      // Not JSON, try plain address
    }

    // Try plain Ethereum address
    try {
      const address = ethers.getAddress(decodedText.trim());
      return {
        type: "keylio_contact",
        address,
      };
    } catch {
      // Not a valid address
    }

    // Try EIP-681 format (ethereum:0x...)
    if (decodedText.startsWith("ethereum:")) {
      try {
        const addressPart = decodedText.replace("ethereum:", "").split("@")[0].split("?")[0];
        const address = ethers.getAddress(addressPart);
        return {
          type: "keylio_contact",
          address,
        };
      } catch {
        // Invalid EIP-681
      }
    }

    return null;
  }, []);

  // Initialize scanner
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    let scanner: Html5Qrcode | null = null;

    const initScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!mounted || !scannerRef.current) return;

        scanner = new Html5Qrcode("qr-scanner-region");
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, // Back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            // Success callback
            const parsed = parseQRData(decodedText);
            if (parsed) {
              setScannedData(parsed);
              setScanState("success");
              // Stop scanning
              if (scanner) {
                scanner.stop().catch(console.error);
              }
            }
          },
          () => {
            // Error callback (ignore - just means no QR found in frame)
          }
        );

        if (mounted) {
          setScanState("scanning");
        }
      } catch (error: unknown) {
        console.error("Scanner init error:", error);
        if (mounted) {
          setScanState("error");
          const errorMessage = error instanceof Error ? error.message : '';
          if (errorMessage.includes("Permission")) {
            setErrorMessage("請允許相機權限以掃描 QR Code");
          } else if (errorMessage.includes("NotFoundError")) {
            setErrorMessage("找不到相機裝置");
          } else {
            setErrorMessage("無法啟動相機，請確認相機權限");
          }
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [isOpen, parseQRData]);

  // Cleanup on close
  const handleClose = useCallback(() => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
    setScanState("initializing");
    setScannedData(null);
    setErrorMessage("");
    onClose();
  }, [onClose]);

  // Confirm scanned contact
  const handleConfirm = useCallback(() => {
    if (scannedData) {
      onScan(scannedData);
      handleClose();
    }
  }, [scannedData, onScan, handleClose]);

  // Retry scanning
  const handleRetry = useCallback(() => {
    setScanState("initializing");
    setScannedData(null);
    setErrorMessage("");
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-keylio-text-primary flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              掃描 QR Code
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
        </DialogHeader>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {/* Initializing / Scanning */}
            {(scanState === "initializing" || scanState === "scanning") && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
                  {/* Scanner region */}
                  <div
                    id="qr-scanner-region"
                    ref={scannerRef}
                    className="w-full h-full"
                  />

                  {/* Overlay with scanning frame */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner markers */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-keylio-teal rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-keylio-teal rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-keylio-teal rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-keylio-teal rounded-br-lg" />
                    </div>

                    {/* Scan line animation */}
                    {scanState === "scanning" && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2 w-[230px] h-0.5 bg-keylio-teal shadow-[0_0_8px_rgba(20,184,166,0.5)]"
                        style={{ top: "calc(50% - 115px)" }}
                        animate={{
                          top: ["calc(50% - 115px)", "calc(50% + 115px)", "calc(50% - 115px)"]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    )}
                  </div>

                  {/* Loading indicator */}
                  {scanState === "initializing" && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-keylio-teal animate-spin" />
                        <p className="text-sm text-white">啟動相機中...</p>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-center text-sm text-keylio-text-muted mt-4">
                  將 QR Code 對準框內進行掃描
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {scanState === "error" && (
              <motion.div
                key="error"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-keylio-text-primary font-medium mb-2">
                  無法開啟相機
                </p>
                <p className="text-sm text-keylio-text-muted mb-6">
                  {errorMessage}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 border-keylio-border-primary"
                  >
                    關閉
                  </Button>
                  <Button
                    onClick={handleRetry}
                    className="flex-1 bg-keylio-teal hover:bg-keylio-teal/90"
                  >
                    重試
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Success State */}
            {scanState === "success" && scannedData ? <motion.div
                key="success"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-keylio-text-primary font-medium mb-2">
                  掃描成功！
                </p>

                <div className="bg-keylio-bg-tertiary rounded-xl p-4 mb-6 text-left">
                  {scannedData.name ? <div className="mb-2">
                      <p className="text-xs text-keylio-text-muted">名稱</p>
                      <p className="text-keylio-text-primary font-medium">
                        {scannedData.name}
                      </p>
                    </div> : null}
                  <div>
                    <p className="text-xs text-keylio-text-muted">地址</p>
                    <p className="text-keylio-text-primary font-mono text-sm break-all">
                      {scannedData.address}
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
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const QRScanner = memo(QRScannerComponent);
export default QRScanner;
