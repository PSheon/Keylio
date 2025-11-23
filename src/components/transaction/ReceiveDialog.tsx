"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, QrCode, Share2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import QRCodeLib from "qrcode";

interface ReceiveDialogProps {
  address: string;
  trigger?: React.ReactNode;
}

export function ReceiveDialog({ address, trigger }: ReceiveDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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

  // Generate payment request QR code
  useEffect(() => {
    if (requestAmount && address) {
      // EIP-681 format: ethereum:<address>[@<chainId>][?value=<value>]
      const value = parseFloat(requestAmount);
      if (value > 0) {
        const paymentUri = `ethereum:${address}?value=${value * 1e18}${requestNote ? `&message=${encodeURIComponent(requestNote)}` : ''}`;
        QRCodeLib.toDataURL(paymentUri, {
          width: 256,
          margin: 2,
          color: {
            dark: "#14b8a6",
            light: "#ffffff",
          },
        }).then(setRequestQrCode);
      }
    } else {
      setRequestQrCode("");
    }
  }, [requestAmount, requestNote, address]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("地址已複製");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPaymentLink = () => {
    const value = parseFloat(requestAmount);
    const paymentUri = `ethereum:${address}?value=${value * 1e18}${requestNote ? `&message=${encodeURIComponent(requestNote)}` : ''}`;
    navigator.clipboard.writeText(paymentUri);
    toast.success("付款連結已複製");
  };

  const handleShare = async (platform: 'whatsapp' | 'email' | 'native') => {
    const shareText = `請付款至我的錢包地址:\n${address}`;
    
    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: '我的錢包地址',
          text: shareText,
        });
        toast.success("分享成功");
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== 'AbortError') {
          handleCopy(); // Fallback to copy
        }
      }
    } else if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    } else if (platform === 'email') {
      const mailtoUrl = `mailto:?subject=${encodeURIComponent('錢包付款地址')}&body=${encodeURIComponent(shareText)}`;
      window.location.href = mailtoUrl;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Receive</Button>}
      </DialogTrigger>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>接收</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="address" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-keylio-bg-tertiary">
            <TabsTrigger value="address">收款地址</TabsTrigger>
            <TabsTrigger value="request">付款請求</TabsTrigger>
          </TabsList>

          {/* Static Address QR */}
          <TabsContent value="address" className="space-y-4 mt-4">
            <div className="flex flex-col items-center space-y-4">
              {qrCodeDataUrl && (
                <div className="p-4 bg-white rounded-xl shadow-lg">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-full max-w-[60vw] md:w-64 md:h-64"
                  />
                </div>
              )}
              
              <div className="w-full space-y-2">
                <Label>您的錢包地址</Label>
                <div className="flex gap-2">
                  <Input
                    value={address}
                    readOnly
                    className="bg-keylio-bg-primary border-keylio-border-primary font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="border-keylio-border-primary hover:bg-keylio-bg-tertiary"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="w-full space-y-2">
                <Label className="text-xs text-keylio-text-secondary">分享地址</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={() => handleCopy()}
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-3 gap-1 border-keylio-border-primary hover:bg-keylio-bg-tertiary"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-xs">複製</span>
                  </Button>
                  
                  <Button
                    onClick={() => handleShare('whatsapp')}
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-3 gap-1 border-keylio-border-primary hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  
                  <Button
                    onClick={() => handleShare('email')}
                    variant="outline"
                    size="sm"
                    className="flex-col h-auto py-3 gap-1 border-keylio-border-primary hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-xs">Email</span>
                  </Button>
                </div>
                
                {/* Native Share Button (if supported) */}
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button
                    onClick={() => handleShare('native')}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-keylio-border-primary hover:bg-keylio-teal/10 hover:text-keylio-teal hover:border-keylio-teal/30"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">更多分享選項...</span>
                  </Button>
                )}
              </div>

              <div className="text-center text-sm text-keylio-text-secondary">
                <p>掃描 QR Code 或分享地址以接收付款</p>
              </div>
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
                  onChange={(e) => setRequestAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-keylio-bg-primary border-keylio-border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">備註 (可選)</Label>
                <Input
                  id="note"
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="例如: 晚餐分帳"
                  className="bg-keylio-bg-primary border-keylio-border-primary"
                />
              </div>

              {requestQrCode ? (
                <div className="flex flex-col items-center space-y-4 pt-4">
                  <div className="p-4 bg-white rounded-xl">
                    <img 
                      src={requestQrCode} 
                      alt="Payment Request QR Code" 
                      className="w-64 h-64"
                    />
                  </div>

                  <div className="w-full p-4 bg-keylio-bg-primary rounded-lg border border-keylio-border-primary">
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
                    <Copy className="w-4 h-4 mr-2" />
                    複製付款連結
                  </Button>

                  <div className="text-xs text-keylio-text-muted text-center">
                    分享此 QR Code 或連結以請求付款
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-keylio-text-secondary">
                  <QrCode className="w-12 h-12 mb-4 opacity-50" />
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
