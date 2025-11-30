"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, ArrowRight, Fingerprint, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/stores/useWalletStore";
import db from "@/lib/storage/db";
import { decryptData, decryptStoredPassword } from "@/lib/crypto";
import { authenticatePasskey } from "@/lib/passkey";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useLiveQuery } from "dexie-react-hooks";

import type { PasskeyMetadata } from "@/lib/storage/db";
import type { EncryptedData } from "@/lib/crypto";

interface UnlockScreenProps {
  onUnlock: () => void;
}

export function UnlockScreen({ onUnlock }: UnlockScreenProps) {
  const [password, setPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const createSession = useWalletStore((state) => state.createSession);
  const setUnlocked = useWalletStore((state) => state.setUnlocked);
  
  // Use session context for state management
  const { storeEncryptedPassword } = useSessionContext();

  // Fetch default Passkey with auto-update
  const defaultPasskey = useLiveQuery(async () => {
    const setting = await db.settings.get({ key: 'passkeys_metadata' });
    const passkeys = (setting?.value as PasskeyMetadata[]) || [];
    return passkeys.find(pk => pk.isDefault) || null;
  });

  const handleUnlock = async () => {
    if (!password) {
      toast.error("請輸入密碼");
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      return;
    }

    setIsProcessing(true);
    try {
      // Verify password by trying to decrypt the mnemonic
      const setting = await db.settings.get({ key: 'encrypted_mnemonic' });
      if (!setting) throw new Error("No mnemonic found");

      // If decryption succeeds, the password is correct
      await decryptData(setting.value as EncryptedData, password);
      
      await createSession(password);
      // Store encrypted password in session for sensitive operations (e.g., backup mnemonic)
      await storeEncryptedPassword(password);
      onUnlock();
      toast.success("歡迎回來！");
    } catch (error) {
      console.error(error);
      toast.error("密碼錯誤");
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePasskeyUnlock = async () => {
    setIsProcessing(true);
    try {
      // Try default Passkey first, fallback to user selection
      const result = defaultPasskey?.credentialId
        ? await authenticatePasskey(defaultPasskey.credentialId).catch(() => {
            toast.info("預設 Passkey 無法使用，請選擇其他");
            return authenticatePasskey();
          })
        : await authenticatePasskey();
      
      // Update last used timestamp (fire and forget)
      if (result.credentialId) {
        db.settings.get({ key: 'passkeys_metadata' }).then(setting => {
          const passkeys = (setting?.value as PasskeyMetadata[]) || [];
          db.settings.put({
            id: setting?.id,
            key: 'passkeys_metadata',
            value: passkeys.map(pk => 
              pk.credentialId === result.credentialId 
                ? { ...pk, lastUsed: Date.now() } 
                : pk
            )
          });
        });
      }
      
      // Get encrypted password from IndexedDB and create full session
      const encryptedPwdSetting = await db.settings.get({ key: 'encrypted_password' });
      if (encryptedPwdSetting) {
        // Decrypt the stored password using app-level key
        const encryptedData = encryptedPwdSetting.value as EncryptedData;
        const pwd = await decryptStoredPassword(encryptedData);
        await createSession(pwd);
        await storeEncryptedPassword(pwd);
      }
      
      setUnlocked(true);
      toast.success("驗證成功");
      onUnlock();
    } catch (error) {
      console.error("Passkey unlock failed:", error);
      toast.error("驗證失敗，請使用密碼登入");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-keylio-bg-primary text-keylio-text-primary p-4 relative overflow-hidden font-sans transition-colors duration-300">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-500/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-keylio-bg-secondary/60 backdrop-blur-xl border-keylio-border-primary shadow-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
              className="mx-auto w-20 h-20 bg-linear-to-br from-teal-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-[0_0_30px_rgba(20,184,166,0.2)] relative group"
            >
              <div className="absolute inset-0 rounded-full bg-teal-500/10 blur-md group-hover:blur-lg transition-all duration-500"></div>
              {isProcessing ? (
                <Unlock className="w-8 h-8 text-teal-400 animate-pulse" />
              ) : (
                <Lock className="w-8 h-8 text-teal-400 group-hover:text-teal-300 transition-colors" />
              )}
            </motion.div>
            
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-keylio-text-primary to-keylio-text-secondary mb-2">
              歡迎回來
            </CardTitle>
            <CardDescription className="text-keylio-text-secondary">
              您的數位資產已安全鎖定
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Passkey Button (Primary Option) */}
            <Button 
              variant="outline" 
              onClick={handlePasskeyUnlock}
              disabled={isProcessing}
              className="w-full border-keylio-border-primary hover:bg-keylio-bg-tertiary hover:text-keylio-text-primary h-14 rounded-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-teal-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform relative z-10">
                <Fingerprint className="w-5 h-5 text-teal-500" />
              </div>
              <span className="text-lg font-medium relative z-10">
                {defaultPasskey 
                  ? `使用 ${defaultPasskey.name} 快速登入` 
                  : "使用 Passkey 快速登入"
                }
              </span>
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-keylio-border-primary" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-keylio-bg-secondary px-4 text-keylio-text-secondary font-medium tracking-wider">或是使用密碼</span>
              </div>
            </div>

            {/* Password Input (Secondary Option) */}
            <motion.div 
              className="space-y-4"
              animate={isShake ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div className="relative group">
                <Input
                  type="password"
                  placeholder="輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  autoComplete="off"
                  data-form-type="other"
                  className="bg-keylio-bg-primary/50 border-keylio-border-primary focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-center text-lg tracking-widest h-12 rounded-xl transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-gray-500"
                />
              </div>

              <Button 
                onClick={handleUnlock} 
                disabled={isProcessing}
                variant="ghost"
                className="w-full text-keylio-text-secondary hover:text-keylio-text-primary hover:bg-keylio-bg-tertiary h-10 rounded-xl transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    驗證中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 text-sm">
                    確認密碼 <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-keylio-text-secondary mt-6 opacity-60">
          受端對端加密保護
        </p>
      </motion.div>
    </div>
  );
}
