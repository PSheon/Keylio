"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowRight, Fingerprint, CheckCircle, Loader2, Users } from "lucide-react";
import { useProvider } from "@/hooks/usePlasma";
import { ethers } from "ethers";
import { authenticatePasskey } from "@/lib/passkey";
import { getAllTokens, formatTokenAmount, formatUSD, getTokenValueUSD } from "@/lib/tokens";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { ContactPicker } from "@/components/contacts/ContactPicker";

interface SendDialogProps {
  fromAddress: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SendDialog({ fromAddress, trigger, onSuccess }: SendDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'sign' | 'success'>('input');
  const [recipient, setRecipient] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [note, setNote] = useState("");
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const provider = useProvider();
  const tokens = getAllTokens();
  const currentToken = tokens.find(t => t.symbol === selectedToken);  
  
  const { data: balance } = useTokenBalance(
    currentToken?.address,
    fromAddress
  );

  const formattedBalance = balance 
    ? formatTokenAmount(balance, currentToken?.decimals || 18)
    : "0";

  const quickAmounts = selectedToken === "ETH" 
    ? [0.01, 0.05, 0.1] 
    : [10, 50, 100];

  const handleContactSelect = (address: string, name?: string) => {
    setRecipient(address);
    if (name) setRecipientName(name);
    setShowContactPicker(false);
  };

  const handlePreview = () => {
    if (!recipient || !amount) {
      toast.error("請輸入完整資訊");
      return;
    }
    if (!ethers.isAddress(recipient)) {
      toast.error("無效的錢包地址");
      return;
    }
    
    const numAmount = parseFloat(amount);
    const numBalance = parseFloat(formattedBalance);
    
    if (numAmount > numBalance) {
      toast.error("餘額不足");
      return;
    }
    
    setStep('preview');
  };

  const handleSign = async () => {
    setIsProcessing(true);
    try {
      await authenticatePasskey();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Save transaction with note to database
      
      setStep('success');
      toast.success("交易已發送");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("驗證失敗或取消");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep('input');
      setRecipient("");
      setRecipientName("");
      setAmount("");
      setNote("");
      setShowContactPicker(false);
    }, 300);
  };

  const valueUSD = currentToken 
    ? getTokenValueUSD(amount || "0", currentToken.symbol)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Send</Button>}
      </DialogTrigger>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>發送</DialogTitle>
        </DialogHeader>

        {step === 'input' && (
          <div className="grid gap-6 py-4">
            {/* Token Selector */}
            <div className="grid gap-2">
              <Label>選擇代幣</Label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="bg-keylio-bg-primary border-keylio-border-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-keylio-bg-secondary border-keylio-border-primary">
                  {tokens.map((token) => (
                    <SelectItem 
                      key={token.symbol} 
                      value={token.symbol}
                      className="text-keylio-text-primary hover:bg-keylio-bg-tertiary"
                    >
                      <div className="flex items-center gap-2">
                        <span>{token.icon}</span>
                        <span>{token.symbol}</span>
                        <span className="text-xs text-keylio-text-secondary">({token.name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-keylio-text-secondary">
                可用餘額: {parseFloat(formattedBalance).toFixed(4)} {selectedToken}
              </div>
            </div>

            {/* Recipient - Contact Picker or Manual Input */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>收款人</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowContactPicker(!showContactPicker)}
                  className="h-7 text-xs text-keylio-teal hover:text-keylio-teal/80"
                >
                  <Users className="w-3 h-3 mr-1" />
                  {showContactPicker ? "手動輸入" : "選擇聯絡人"}
                </Button>
              </div>
              
              {showContactPicker ? (
                <div className="p-4 rounded-lg border border-keylio-border-primary bg-keylio-bg-primary">
                  <ContactPicker 
                    onSelect={handleContactSelect}
                    currentAddress={recipient}
                  />
                </div>
              ) : (
                <>
                  <Input
                    value={recipient}
                    onChange={(e) => {
                      setRecipient(e.target.value);
                      setRecipientName("");
                    }}
                    className="bg-keylio-bg-primary border-keylio-border-primary font-mono text-sm"
                    placeholder="0x... 或點擊上方選擇聯絡人"
                  />
                  {recipientName && (
                    <div className="text-xs text-keylio-teal flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {recipientName}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">金額</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-keylio-bg-primary border-keylio-border-primary pr-16"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-2.5 text-keylio-text-secondary text-sm">{selectedToken}</span>
              </div>
              {amount && (
                <div className="text-xs text-keylio-text-muted">
                  ≈ {formatUSD(valueUSD)}
                </div>
              )}
              <div className="flex gap-2 mt-1">
                {quickAmounts.map(val => (
                  <button 
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="text-xs bg-keylio-bg-tertiary px-2 py-1 rounded hover:bg-keylio-teal/20 hover:text-keylio-teal transition-colors"
                  >
                    {val}
                  </button>
                ))}
                <button 
                  onClick={() => setAmount(formattedBalance)}
                  className="text-xs bg-keylio-bg-tertiary px-2 py-1 rounded hover:bg-keylio-teal/20 hover:text-keylio-teal transition-colors"
                >
                  最大
                </button>
              </div>
            </div>

            {/* Note (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="note">備註 (可選)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-keylio-bg-primary border-keylio-border-primary resize-none h-16"
                placeholder="例如: 晚餐分帳"
              />
            </div>

            <Button onClick={handlePreview} className="w-full bg-teal-600 hover:bg-teal-700 mt-2">
              預覽交易
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="grid gap-6 py-4">
            <div className="bg-keylio-bg-primary p-4 rounded-xl border border-keylio-border-primary space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-keylio-text-secondary text-sm">發送金額</span>
                <div className="text-right">
                  <div className="text-xl font-bold flex items-center gap-2">
                    {currentToken?.icon} {amount} {selectedToken}
                  </div>
                  <div className="text-xs text-keylio-text-muted">{formatUSD(valueUSD)}</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">手續費</span>
                <span className="text-teal-400 text-sm font-medium">✨ 極低 (Sepolia)</span>
              </div>
              {note && (
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm">備註</span>
                  <span className="text-sm text-right max-w-[200px]">{note}</span>
                </div>
              )}
              <div className="h-px bg-[#1e2749]" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">總計</span>
                <div className="text-right">
                  <div className="text-xl font-bold">{amount} {selectedToken}</div>
                  <div className="text-xs text-keylio-text-muted">{formatUSD(valueUSD)}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-keylio-bg-tertiary/50 p-3 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-teal-500" />
              </div>
              <div>
                <div className="text-xs text-gray-400">收款人</div>
                {recipientName && (
                  <div className="text-sm font-medium text-keylio-teal mb-1">{recipientName}</div>
                )}
                <div className="text-sm font-mono break-all">{recipient}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('input')} className="flex-1 border-keylio-border-primary hover:bg-keylio-bg-tertiary hover:text-keylio-text-primary">
                修改
              </Button>
              <Button onClick={() => setStep('sign')} className="flex-1 bg-teal-600 hover:bg-teal-700">
                確認發送
              </Button>
            </div>
          </div>
        )}

        {step === 'sign' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center animate-pulse">
              <Fingerprint className="w-10 h-10 text-teal-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">驗證 Passkey</h3>
              <p className="text-sm text-gray-400">請使用生物辨識確認此筆交易</p>
            </div>
            <Button 
              onClick={handleSign} 
              disabled={isProcessing}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : (
                "👆 點擊驗證"
              )}
            </Button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">發送成功！</h3>
              <p className="text-sm text-gray-400">交易已廣播至網路</p>
              {note && (
                <p className="text-xs text-keylio-text-muted mt-2">📝 {note}</p>
              )}
            </div>
            <Button onClick={reset} className="w-full bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80">
              完成
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
