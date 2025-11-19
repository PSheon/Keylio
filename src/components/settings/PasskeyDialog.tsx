import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Plus, Trash2, Fingerprint, Lock } from "lucide-react";
import { toast } from "sonner";
import db from "@/lib/storage/db";
import { useLiveQuery } from "dexie-react-hooks";
import { registerPasskey, authenticatePasskey } from "@/lib/passkey";
import { decryptData } from "@/lib/crypto";
import { useWalletStore } from "@/stores/useWalletStore";

interface RegisteredPasskey {
  id: string;
  name: string;
  createdAt: number;
}

export function PasskeyDialog() {
  const sessionPassword = useWalletStore((state) => state.sessionPassword);
  
  const [isOpen, setIsOpen] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [isProcessingPasskey, setIsProcessingPasskey] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Fetch Passkeys
  const passkeys = useLiveQuery(async () => {
    const setting = await db.settings.get({ key: 'passkeys_metadata' });
    return (setting?.value as RegisteredPasskey[]) || [];
  });

  const resetDialog = () => {
    setIsOpen(false);
    setIsUnlocked(false);
    setAuthPassword("");
    setNewPasskeyName("");
    setShowPasswordInput(false);
  };

  const handleAuth = async (usePassword: boolean = false) => {
    if (!usePassword) {
      // Passkey verification path
      setIsAuthenticating(true);
      try {
        await authenticatePasskey();
        
        // If no session password, we still need to prompt for password to unlock features
        if (!sessionPassword) {
          toast.error("需要密碼才能解密密鑰 (請先使用密碼登入一次)");
          setShowPasswordInput(true);
          return;
        }
        
        setIsUnlocked(true);
        toast.success("驗證成功");
      } catch (error) {
        toast.error("Passkey 驗證失敗");
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      // Password verification path
      if (!authPassword) {
        toast.error("請輸入密碼");
        return;
      }
      
      setIsAuthenticating(true);
      try {
        const setting = await db.settings.get({ key: 'encrypted_mnemonic' });
        if (!setting) throw new Error("No key found");
        
        // Try to decrypt to verify password
        await decryptData(setting.value, authPassword);
        setIsUnlocked(true);
        setAuthPassword("");
        toast.success("密碼驗證成功");
      } catch (error) {
        toast.error("密碼錯誤");
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  const handleAddPasskey = async () => {
    if (!newPasskeyName.trim()) {
      toast.error("請輸入 Passkey 名稱");
      return;
    }

    setIsProcessingPasskey(true);
    try {
      await registerPasskey(newPasskeyName);
      
      const newPasskey: RegisteredPasskey = {
        id: crypto.randomUUID(),
        name: newPasskeyName,
        createdAt: Date.now(),
      };
      
      const currentPasskeys = passkeys || [];
      
      // Get existing setting to preserve ID
      const existingSetting = await db.settings.get({ key: 'passkeys_metadata' });
      
      await db.settings.put({
        id: existingSetting?.id, // Include ID if it exists to update instead of insert
        key: 'passkeys_metadata',
        value: [...currentPasskeys, newPasskey]
      });

      setNewPasskeyName("");
      toast.success(`Passkey "${newPasskey.name}" 新增成功`);
    } catch (error) {
      console.error(error);
      toast.error("Passkey 註冊失敗或取消");
    } finally {
      setIsProcessingPasskey(false);
    }
  };

  const handleRemovePasskey = async (id: string) => {
    if (!passkeys) return;
    if (passkeys.length <= 1) {
      toast.error("至少需要保留一個 Passkey");
      return;
    }

    const updatedPasskeys = passkeys.filter(p => p.id !== id);
    
    // Get existing setting to preserve ID
    const existingSetting = await db.settings.get({ key: 'passkeys_metadata' });

    await db.settings.put({
      id: existingSetting?.id,
      key: 'passkeys_metadata',
      value: updatedPasskeys
    });
    toast.success("Passkey 已移除");
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
        <div className="flex items-center justify-between p-4 rounded-lg bg-keylio-bg-primary border border-keylio-border-primary cursor-pointer hover:border-keylio-border-hover transition-colors">
          <div>
            <div className="font-medium flex items-center gap-2">
              管理 Passkeys
              <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                {passkeys?.length || 0} 個已啟用
              </span>
            </div>
            <div className="text-sm text-keylio-text-secondary">管理您的生物辨識金鑰</div>
          </div>
          <ChevronRight className="w-5 h-5 text-keylio-text-muted" />
        </div>
      </DialogTrigger>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary sm:max-w-md">
        <DialogHeader>
          <DialogTitle>管理 Passkeys</DialogTitle>
          <CardDescription className="text-keylio-text-secondary">
            您可以新增多個設備的 Passkey 以方便登入。
          </CardDescription>
        </DialogHeader>
        
        {!isUnlocked ? (
          // Authentication Screen
          <div className="space-y-4 py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-keylio-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-keylio-teal" />
              </div>
              <p className="text-sm text-keylio-text-secondary">
                為了保護您的帳戶安全，請先進行驗證
              </p>
            </div>

            {!showPasswordInput ? (
              // Passkey verification (default)
              <div className="space-y-4">
                <Button
                  onClick={() => handleAuth(false)}
                  disabled={isAuthenticating}
                  className="w-full bg-keylio-teal hover:bg-keylio-teal/80 h-12 text-lg"
                >
                  {isAuthenticating ? (
                    "驗證中..."
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5 mr-2" />
                      使用 Passkey 驗證
                    </>
                  )}
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
              // Password verification (fallback)
              <div className="space-y-4">
                <div>
                  <Label htmlFor="passkey-auth-password">輸入密碼</Label>
                  <Input
                    id="passkey-auth-password"
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="請輸入您的密碼"
                    className="bg-keylio-bg-primary border-keylio-border-primary mt-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAuth(true);
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => handleAuth(true)}
                  disabled={isAuthenticating || !authPassword}
                  className="w-full bg-keylio-teal hover:bg-keylio-teal/80"
                >
                  {isAuthenticating ? "驗證中..." : "確認"}
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
          // Management Screen (after authentication)
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {passkeys?.map((pk) => (
                <div key={pk.id} className="flex items-center justify-between bg-keylio-bg-primary p-3 rounded border border-keylio-border-primary">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-4 h-4 text-teal-500" />
                    <div>
                      <div className="text-sm font-medium">{pk.name}</div>
                      <div className="text-xs text-keylio-text-muted">{new Date(pk.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePasskey(pk.id)}
                    className="text-keylio-text-muted hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t border-keylio-border-primary">
              <Input
                placeholder="新 Passkey 名稱 (例如: iPad)"
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                className="bg-keylio-bg-primary border-keylio-border-primary focus:border-keylio-teal"
              />
              <Button 
                onClick={handleAddPasskey}
                disabled={isProcessingPasskey || !newPasskeyName.trim()}
                className="bg-teal-600 hover:bg-teal-700 shrink-0"
              >
                {isProcessingPasskey ? "..." : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
