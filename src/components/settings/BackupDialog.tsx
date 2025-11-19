import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Copy, CheckCircle, Lock, AlertTriangle, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import db from "@/lib/storage/db";
import { authenticatePasskey } from "@/lib/passkey";
import { decryptData } from "@/lib/crypto";
import { useWalletStore } from "@/stores/useWalletStore";

export function BackupDialog() {
  const sessionPassword = useWalletStore((state) => state.sessionPassword);
  
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const resetDialog = () => {
    setIsOpen(false);
    setPassword("");
    setMnemonic(null);
    setIsRevealed(false);
    setShowPasswordInput(false);
  };

  const handleRevealMnemonic = async (pwdOverride?: string): Promise<boolean> => {
    const pwdToUse = pwdOverride || password;
    
    if (!pwdToUse) {
      toast.error("請輸入密碼");
      return false;
    }

    try {
      const setting = await db.settings.get({ key: 'encrypted_mnemonic' });
      if (!setting) throw new Error("No mnemonic found");

      const decrypted = await decryptData(setting.value, pwdToUse);
      setMnemonic(decrypted);
      setIsRevealed(true);
      return true;
    } catch (error) {
      toast.error("密碼錯誤");
      return false;
    }
  };

  const handleAuth = async (usePassword: boolean = false) => {
    if (!usePassword) {
      // Passkey verification path
      try {
        await authenticatePasskey();
        
        // If no session password, we still need to prompt for password to decrypt
        if (!sessionPassword) {
          toast.error("Passkey 驗證成功！但需要密碼才能解密助記詞 (請先使用密碼登入一次)");
          setShowPasswordInput(true);
          return;
        }

        const success = await handleRevealMnemonic(sessionPassword);
        if (success) {
          toast.success("驗證成功");
        }
      } catch (error) {
        toast.error("Passkey 驗證失敗");
      }
    } else {
      // Password verification path
      if (!password) {
        toast.error("請輸入密碼");
        return;
      }
      
      await handleRevealMnemonic(password);
    }
  };

  const handleCopyMnemonic = () => {
    if (mnemonic) {
      navigator.clipboard.writeText(mnemonic);
      setHasCopied(true);
      toast.success("已複製到剪貼簿");
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open) {
        setIsOpen(true);
      } else {
        resetDialog();
      }
    }}>
      <DialogTrigger asChild>
        <div 
          className="flex items-center justify-between p-4 rounded-lg bg-keylio-bg-primary border border-keylio-border-primary cursor-pointer hover:border-keylio-teal/50 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <div>
            <div className="font-medium">備份助記詞</div>
            <div className="text-sm text-keylio-text-secondary">查看或重新備份您的助記詞</div>
          </div>
          <ChevronRight className="w-5 h-5 text-keylio-text-muted" />
        </div>
      </DialogTrigger>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary sm:max-w-md">
        <DialogHeader>
          <DialogTitle>備份助記詞</DialogTitle>
          <CardDescription className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            警告：請確保周圍沒有人正在看您的螢幕。
          </CardDescription>
        </DialogHeader>

        {!isRevealed ? (
          <div className="space-y-4 py-4">
            {/* Smart Auth Flow */}
            {!showPasswordInput ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-keylio-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-keylio-teal" />
                  </div>
                  <p className="text-sm text-keylio-text-secondary">
                    為了保護您的帳戶安全，請先進行驗證
                  </p>
                </div>

                <Button 
                  onClick={() => handleAuth(false)} 
                  className="w-full bg-keylio-teal hover:bg-keylio-teal/80 h-12 text-lg"
                >
                  <Fingerprint className="w-5 h-5 mr-2" />
                  使用 Passkey 驗證
                </Button>
                <div className="text-center">
                  <button 
                    onClick={() => setShowPasswordInput(true)}
                    className="text-sm text-keylio-text-secondary hover:text-keylio-text-primary underline decoration-dotted"
                  >
                    或使用密碼驗證
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>輸入密碼以解鎖</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-keylio-bg-primary border-keylio-border-primary"
                    autoFocus
                  />
                </div>
                <Button onClick={() => handleAuth(true)} className="w-full bg-keylio-teal hover:bg-keylio-teal/80">
                  顯示助記詞
                </Button>
                {sessionPassword && (
                  <div className="text-center">
                    <button 
                      onClick={() => setShowPasswordInput(false)}
                      className="text-sm text-keylio-text-secondary hover:text-keylio-text-primary underline decoration-dotted"
                    >
                      返回 Passkey 驗證
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-2 relative">
              {mnemonic?.split(" ").map((word, i) => (
                <div key={i} className="bg-keylio-bg-primary p-2 rounded border border-keylio-border-primary flex items-center gap-2">
                  <span className="text-keylio-text-muted text-xs w-4">{i + 1}.</span>
                  <span className="font-mono text-sm font-bold text-teal-400">{word}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 border-keylio-border-primary hover:bg-keylio-bg-tertiary hover:text-keylio-text-primary"
                onClick={handleCopyMnemonic}
              >
                {hasCopied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {hasCopied ? "已複製" : "複製"}
              </Button>
              <Button 
                onClick={resetDialog}
                className="flex-1 bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80"
              >
                關閉
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
