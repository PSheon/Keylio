"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, 
  QrCode, 
  Share2, 
  Wallet, 
  Receipt, 
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import QRCodeLib from "qrcode";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ReceiveDialogProps {
  address: string;
  trigger?: React.ReactNode;
}

// ============================================================================
// Reusable Components
// ============================================================================

/** Clickable address card with copy functionality */
function AddressCard({ 
  address, 
  label = "錢包地址",
  className 
}: { 
  address: string; 
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("地址已複製");
    setTimeout(() => setCopied(false), 2000);
  };

  const shortenAddress = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "w-full p-4 rounded-xl border transition-all duration-200",
        "bg-keylio-bg-primary border-keylio-border hover:border-keylio-teal/50",
        "group cursor-pointer text-left",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-keylio-text-secondary mb-1">{label}</p>
          <p className="font-mono text-sm text-keylio-text-primary truncate">
            {shortenAddress(address)}
          </p>
        </div>
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          copied 
            ? "bg-emerald-500/10 text-emerald-500" 
            : "bg-keylio-bg-tertiary text-keylio-text-secondary group-hover:text-keylio-teal"
        )}>
          {copied ? (
            <CheckCircle2 className="size-5" />
          ) : (
            <Copy className="size-5" />
          )}
        </div>
      </div>
      <p className="text-xs text-keylio-text-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        點擊複製完整地址
      </p>
    </button>
  );
}

/** Network warning banner */
function NetworkWarning({ network = "Plasma" }: { network?: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
      <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="text-sm">
        <p className="text-amber-500 font-medium">請確認網路</p>
        <p className="text-keylio-text-secondary mt-0.5">
          僅接受 <span className="text-keylio-text-primary font-medium">{network}</span> 網路的資產，
          其他網路轉入可能導致資產遺失。
        </p>
      </div>
    </div>
  );
}

/** Share button group - simplified */
function ShareButtons({ 
  address, 
  onCopy 
}: { 
  address: string;
  onCopy: () => void;
}) {
  const handleShare = async () => {
    const shareText = `請付款至我的錢包地址:\n${address}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的錢包地址',
          text: shareText,
        });
        toast.success("分享成功");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          onCopy();
        }
      }
    } else {
      onCopy();
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      className="w-full gap-2 border-keylio-border text-keylio-text-secondary hover:bg-keylio-teal/10 hover:text-keylio-teal hover:border-keylio-teal/30"
    >
      <Share2 className="size-4" />
      分享地址
    </Button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ReceiveDialog({ address, trigger }: ReceiveDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  
  // Payment request fields
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestQrCode, setRequestQrCode] = useState("");

  // Generate static QR code for address
  useEffect(() => {
    if (isOpen && address) {
      QRCodeLib.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: "#14b8a6",
          light: "#ffffff",
        },
      }).then(setQrCodeDataUrl);
    }
  }, [isOpen, address]);

  // Compute payment URI from inputs
  const paymentUri = useMemo(() => {
    if (!requestAmount || !address) return null;
    const value = parseFloat(requestAmount);
    if (value <= 0 || isNaN(value)) return null;
    return `ethereum:${address}?value=${value * 1e18}${requestNote ? `&message=${encodeURIComponent(requestNote)}` : ''}`;
  }, [requestAmount, requestNote, address]);

  // Generate payment request QR code when paymentUri changes
  useEffect(() => {
    if (paymentUri) {
      QRCodeLib.toDataURL(paymentUri, {
        width: 256,
        margin: 2,
        color: {
          dark: "#14b8a6",
          light: "#ffffff",
        },
      }).then(setRequestQrCode);
    }
  }, [paymentUri]);
  
  // Clear QR code when amount is cleared
  const handleAmountChange = useCallback((value: string) => {
    setRequestAmount(value);
    if (!value || parseFloat(value) <= 0) {
      setRequestQrCode("");
    }
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(address);
    toast.success("地址已複製");
  }, [address]);

  const handleCopyPaymentLink = useCallback(() => {
    if (!paymentUri) return;
    navigator.clipboard.writeText(paymentUri);
    toast.success("付款連結已複製");
  }, [paymentUri]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Receive</Button>}
      </DialogTrigger>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>接收</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="address" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-keylio-bg-tertiary p-1 rounded-lg">
            <TabsTrigger 
              value="address" 
              className="gap-2 data-[state=active]:bg-keylio-bg-secondary data-[state=active]:text-keylio-text-primary rounded-md"
            >
              <Wallet className="size-4" />
              收款地址
            </TabsTrigger>
            <TabsTrigger 
              value="request"
              className="gap-2 data-[state=active]:bg-keylio-bg-secondary data-[state=active]:text-keylio-text-primary rounded-md"
            >
              <Receipt className="size-4" />
              付款請求
            </TabsTrigger>
          </TabsList>

          {/* Static Address QR */}
          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="flex flex-col items-center space-y-4">
              {/* QR Code */}
              {qrCodeDataUrl && (
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-full max-w-[60vw] md:w-48 md:h-48"
                  />
                </div>
              )}

              {/* Network Warning */}
              <NetworkWarning network="Plasma" />
              
              {/* Address Card (clickable) */}
              <AddressCard address={address} label="您的收款地址" />

              {/* Share Button */}
              <ShareButtons address={address} onCopy={handleCopy} />

              <p className="text-xs text-keylio-text-muted text-center">
                掃描 QR Code 或分享地址以接收付款
              </p>
            </div>
          </TabsContent>

          {/* Payment Request with Amount */}
          <TabsContent value="request" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">請求金額 (ETH)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={requestAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="bg-keylio-bg-primary border-keylio-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">備註 (可選)</Label>
                <Input
                  id="note"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="例如: 晚餐分帳"
                  className="bg-keylio-bg-primary border-keylio-border"
                />
              </div>

              {requestQrCode ? (
                <div className="flex flex-col items-center space-y-4 pt-4">
                  <div className="p-4 bg-white rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={requestQrCode} 
                      alt="Payment Request QR Code" 
                      className="w-48 h-48"
                    />
                  </div>

                  <div className="w-full p-4 bg-keylio-bg-primary rounded-lg border border-keylio-border">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-keylio-teal">
                        {requestAmount} ETH
                      </div>
                      {requestNote && (
                        <div className="text-sm text-keylio-text-secondary">
                          📝 {requestNote}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleCopyPaymentLink}
                    className="w-full bg-keylio-teal hover:bg-keylio-teal/80"
                  >
                    <Copy className="size-4 mr-2" />
                    複製付款連結
                  </Button>

                  <p className="text-xs text-keylio-text-muted text-center">
                    分享此 QR Code 或連結以請求付款
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-keylio-text-secondary">
                  <QrCode className="size-12 mb-4 opacity-50" />
                  <p className="text-sm">輸入金額以生成付款請求</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
