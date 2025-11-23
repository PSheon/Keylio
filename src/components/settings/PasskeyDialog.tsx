import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight, Plus, Trash2, Fingerprint, Lock, Star, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import db, { PasskeyMetadata } from "@/lib/storage/db";
import { useLiveQuery } from "dexie-react-hooks";
import { authenticatePasskey } from "@/lib/passkey";
import { decryptData, type EncryptedData } from "@/lib/crypto";
import { useWalletStore } from "@/stores/useWalletStore";
import { usePasskeyManager } from "@/hooks/usePasskeyManager";
import { usePasskeyEditor } from "@/hooks/usePasskeyEditor";

export function PasskeyDialog() {
  const sessionPassword = useWalletStore((state) => state.sessionPassword);
  
  const [isOpen, setIsOpen] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  
  const passkeyManager = usePasskeyManager();
  const passkeyEditor = usePasskeyEditor();

  const passkeys = useLiveQuery(async () => {
    const setting = await db.settings.get({ key: 'passkeys_metadata' });
    return (setting?.value as PasskeyMetadata[]) || [];
  });

  const resetDialog = () => {
    setIsOpen(false);
    setIsUnlocked(false);
    setAuthPassword("");
    setNewPasskeyName("");
    setShowPasswordInput(false);
    passkeyEditor.resetEditing();
  };

  const handleAuth = async (usePassword: boolean = false) => {
    if (!usePassword) {
      // Passkey verification path
      setIsAuthenticating(true);
      try {
        // Try default Passkey first
        const defaultPasskey = passkeys?.find(pk => pk.isDefault);
        let result;
        try {
          result = await authenticatePasskey(defaultPasskey?.credentialId);
        } catch (defaultError) {
          // If default fails, let user choose
          if (defaultPasskey) {
            toast.info("預設 Passkey 無法使用，請選擇其他 Passkey");
            result = await authenticatePasskey();
          } else {
            throw defaultError;
          }
        }
        
        // Update last used timestamp
        if (result.credentialId && passkeys) {
          const updatedPasskeys = passkeys.map(pk => 
            pk.credentialId === result.credentialId 
              ? { ...pk, lastUsed: Date.now() } 
              : pk
          );
          const existingSetting = await db.settings.get({ key: 'passkeys_metadata' });
          await db.settings.put({
            id: existingSetting?.id,
            key: 'passkeys_metadata',
            value: updatedPasskeys
          });
        }
        
        setIsUnlocked(true);
        toast.success("驗證成功");
      } catch {
        toast.error("Passkey 驗證失敗，請使用密碼驗證");
        setShowPasswordInput(true);
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
        await decryptData(setting.value as EncryptedData, authPassword);
        setIsUnlocked(true);
        setAuthPassword("");
        toast.success("密碼驗證成功");
      } catch {
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

    const newPasskey = await passkeyManager.addPasskey(newPasskeyName);
    if (newPasskey) {
      setNewPasskeyName("");
    }
  };

  const handleRemovePasskey = async (id: string) => {
    await passkeyManager.removePasskey(id);
  };

  const handleSetDefault = async (id: string) => {
    await passkeyManager.setDefaultPasskey(id);
  };

  const savePasskeyName = async (id: string) => {
    const success = await passkeyManager.updatePasskeyName(id, passkeyEditor.editingName);
    if (success) {
      passkeyEditor.resetEditing();
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
                  <div className="flex items-center gap-3 flex-1">
                    <Fingerprint className="w-4 h-4 text-teal-500" />
                    <div className="flex-1">
                      {passkeyEditor.editingPasskeyId === pk.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={passkeyEditor.editInputRef}
                            value={passkeyEditor.editingName}
                            onChange={(e) => passkeyEditor.setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePasskeyName(pk.id);
                              if (e.key === 'Escape') passkeyEditor.cancelEditing();
                            }}
                            className="h-8 text-sm bg-keylio-bg-secondary border-keylio-border-primary"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => savePasskeyName(pk.id)}
                            className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={passkeyEditor.cancelEditing}
                            className="h-8 w-8 text-keylio-text-muted hover:text-keylio-text-primary hover:bg-keylio-bg-tertiary"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-medium flex items-center gap-2">
                            {pk.name}
                            {pk.isDefault && (
                              <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" />
                                預設
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-keylio-text-muted">
                            {new Date(pk.createdAt).toLocaleDateString()}
                            {pk.lastUsed && ` • 上次使用: ${new Date(pk.lastUsed).toLocaleDateString()}`}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {passkeyEditor.editingPasskeyId !== pk.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => passkeyEditor.startEditing(pk)}
                          className="text-keylio-text-muted hover:text-blue-500 hover:bg-blue-500/10"
                          title="編輯名稱"
                        >
                          <Edit2 size={16} />
                        </Button>
                        {!pk.isDefault && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSetDefault(pk.id)}
                            className="text-keylio-text-muted hover:text-teal-500 hover:bg-teal-500/10"
                            title="設為預設"
                          >
                            <Star size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePasskey(pk.id)}
                          disabled={pk.isDefault}
                          className="text-keylio-text-muted hover:text-red-500 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={pk.isDefault ? "預設 Passkey 無法刪除" : "刪除此 Passkey"}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4 border-t border-keylio-border-primary">
              <Input
                placeholder="新 Passkey 名稱 (例如: iPad)"
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPasskeyName.trim() && !passkeyManager.isProcessing) {
                    handleAddPasskey();
                  }
                }}
                disabled={passkeyManager.isProcessing}
                className="bg-keylio-bg-primary border-keylio-border-primary focus:border-keylio-teal"
              />
              <Button 
                onClick={handleAddPasskey}
                disabled={passkeyManager.isProcessing || !newPasskeyName.trim()}
                className="bg-teal-600 hover:bg-teal-700 shrink-0 disabled:opacity-50"
                title={passkeyManager.isProcessing ? "儲存中..." : "新增 Passkey"}
              >
                {passkeyManager.isProcessing ? "儲存中..." : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
