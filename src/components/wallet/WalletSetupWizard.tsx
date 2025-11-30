"use client";

import { useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Fingerprint, Plus, Trash2, Edit2, Check, X, Sparkles } from "lucide-react";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePasskeyEditor } from "@/hooks/usePasskeyEditor";
import { usePasskeyManager } from "@/hooks/usePasskeyManager";
import { deriveWallet, deriveXpub, encryptData, encryptPasswordForStorage } from "@/lib/crypto";
import db from "@/lib/storage/db";
import type { PasskeyMetadata } from "@/lib/storage/db";
import { showSuccess, showError } from "@/lib/toast";
import { useWalletStore } from "@/stores/useWalletStore";

interface WalletSetupWizardProps {
  onComplete: () => void;
}

// Default wallet name
const DEFAULT_WALLET_NAME = "主錢包";

// Total steps: 1 (Password) + 2 (Passkey) = 2 steps
const TOTAL_STEPS = 2;

export const WalletSetupWizard = memo(function WalletSetupWizard({ onComplete }: WalletSetupWizardProps) {
  // Step 1 = Password, Step 2 = PassKey
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [passkeys, setPasskeys] = useState<PasskeyMetadata[]>([]);

  const passkeyManager = usePasskeyManager();
  const passkeyEditor = usePasskeyEditor();
  const { storeEncryptedPassword } = useSessionContext();

  const tempMnemonic = useWalletStore((state) => state.tempMnemonic);
  const setWallets = useWalletStore((state) => state.setWallets);
  const clearTempMnemonic = useWalletStore((state) => state.clearTempMnemonic);
  const createSession = useWalletStore((state) => state.createSession);

  const getPasswordStrength = useCallback((pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[a-z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[!@#$%^&*]/.test(pwd)) score += 20;
    return score;
  }, []);

  const strengthScore = getPasswordStrength(password);
  const isPasswordValid = strengthScore >= 80 && password === confirmPassword;

  const getStrengthColor = (score: number) => {
    if (score < 40) return "bg-red-500";
    if (score < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthLabel = (score: number) => {
    if (score === 0) return "請輸入密碼";
    if (score < 40) return "太弱";
    if (score < 80) return "普通";
    return "強";
  };

  const handleStep1 = useCallback(() => {
    if (!isPasswordValid) {
      showError("密碼不符合要求", "請確認密碼強度且兩次輸入一致");
      return;
    }
    setStep(2);
  }, [isPasswordValid]);

  const handleAddPasskey = useCallback(async () => {
    const existingCredentialIds = passkeys.map(pk => pk.credentialId);
    const newPasskey = await passkeyManager.addPasskey(undefined, existingCredentialIds);
    if (newPasskey) {
      setPasskeys(prev => [...prev, newPasskey]);
    }
  }, [passkeys, passkeyManager]);

  const savePasskeyName = useCallback(async (id: string) => {
    const existingNames = passkeys.filter(p => p.id !== id).map(p => p.name);
    const success = await passkeyManager.updatePasskeyName(id, passkeyEditor.editingName, existingNames);
    if (success) {
      setPasskeys(prev => prev.map(p => p.id === id ? { ...p, name: passkeyEditor.editingName.trim() } : p));
      passkeyEditor.resetEditing();
    }
  }, [passkeys, passkeyManager, passkeyEditor]);

  const removePasskey = useCallback(async (id: string) => {
    const success = await passkeyManager.removePasskey(id);
    if (success) {
      setPasskeys(prev => prev.filter(p => p.id !== id));
    }
  }, [passkeyManager]);

  const handleCompleteSetup = useCallback(async () => {
    if (!tempMnemonic) {
      showError("發生錯誤", "助記詞遺失，請重新開始");
      return;
    }

    if (passkeys.length === 0) {
      showError("請至少設定一個 Passkey");
      return;
    }

    setIsProcessing(true);
    try {
      const encryptedMnemonic = await encryptData(tempMnemonic, password);
      // Encrypt password for Passkey-based unlock (using app-level key)
      const encryptedPassword = await encryptPasswordForStorage(password);
      const wallet = deriveWallet(tempMnemonic, 0);
      // Derive xpub for creating sub-wallets without needing mnemonic
      const xpub = deriveXpub(tempMnemonic);

      await db.transaction('rw', db.settings, db.sub_wallets, async () => {
        // Get existing records to preserve IDs (prevents ConstraintError)
        const existingMnemonic = await db.settings.get({ key: 'encrypted_mnemonic' });
        const existingPasskeys = await db.settings.get({ key: 'passkeys_metadata' });
        const existingXpub = await db.settings.get({ key: 'xpub' });
        const existingEncryptedPwd = await db.settings.get({ key: 'encrypted_password' });

        await db.settings.put({
          id: existingMnemonic?.id,
          key: 'encrypted_mnemonic',
          value: encryptedMnemonic
        });
        await db.settings.put({
          id: existingPasskeys?.id,
          key: 'passkeys_metadata',
          value: passkeys
        });
        // Store xpub for deriving sub-wallet addresses (safe to store, cannot sign transactions)
        await db.settings.put({
          id: existingXpub?.id,
          key: 'xpub',
          value: xpub
        });
        // Store encrypted password for Passkey-based session creation
        await db.settings.put({
          id: existingEncryptedPwd?.id,
          key: 'encrypted_password',
          value: encryptedPassword
        });

        // Use default wallet name per Spec (user can rename later)
        const subWallet = {
          name: DEFAULT_WALLET_NAME,
          address: wallet.address,
          index: 0,
          color: '#14b8a6',
          emoji: '💼',
          createdAt: Date.now(),
        };
        const id = await db.sub_wallets.add(subWallet);
        setWallets([{ ...subWallet, id }]);
      });

      await createSession(password);
      // Store password in session for Passkey-based operations (e.g., backup mnemonic)
      await storeEncryptedPassword(password);
      clearTempMnemonic();
      showSuccess("錢包創建成功", "歡迎使用 Keylio");
      onComplete();

    } catch (error) {
      console.error(error);
      showError("創建失敗", "請稍後重試");
    } finally {
      setIsProcessing(false);
    }
  }, [tempMnemonic, passkeys, password, setWallets, createSession, clearTempMnemonic, onComplete, storeEncryptedPassword]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[150px]" />
      </div>

      <Card className="w-full max-w-md bg-[#0a0e17] border border-white/10 text-white relative z-10 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 tracking-wider uppercase">Setup Wizard</span>
            <span className="text-xs text-gray-500 font-mono">{step} / {TOTAL_STEPS}</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-1 bg-white/5 *:bg-teal-500" />
        </CardHeader>

        <CardContent className="pt-8 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1: Password Setup */}
            {step === 1 && (
              <PasswordStep
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                strengthScore={strengthScore}
                isPasswordValid={isPasswordValid}
                getStrengthColor={getStrengthColor}
                getStrengthLabel={getStrengthLabel}
                onNext={handleStep1}
              />
            )}

            {/* Step 2: PassKey Setup */}
            {step === 2 && (
              <PasskeyStep
                passkeys={passkeys}
                passkeyEditor={passkeyEditor}
                isProcessing={isProcessing}
                onAddPasskey={handleAddPasskey}
                onSavePasskeyName={savePasskeyName}
                onRemovePasskey={removePasskey}
                onBack={() => setStep(1)}
                onComplete={handleCompleteSetup}
              />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
});

// ============================================
// Step Components
// ============================================

interface PasswordStepProps {
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  strengthScore: number;
  isPasswordValid: boolean;
  getStrengthColor: (score: number) => string;
  getStrengthLabel: (score: number) => string;
  onNext: () => void;
}

const PasswordStep = memo(function PasswordStep({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  strengthScore,
  isPasswordValid,
  getStrengthColor,
  getStrengthLabel,
  onNext,
}: PasswordStepProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col"
    >
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-teal-500/20">
          <Sparkles className="w-7 h-7 text-teal-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">設定錢包密碼</h3>
        <p className="text-sm text-gray-400">用於加密您的助記詞與私鑰</p>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <div className="relative group">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="設定錢包密碼"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              name="keylio-wallet-pwd"
              className="bg-white/5 border-white/10 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 pr-10 h-12 rounded-xl transition-all"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
              type="button"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Visual Strength Meter */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs px-1">
              <span className="text-gray-500">密碼強度</span>
              <span className={`${strengthScore < 40 ? 'text-red-400' : strengthScore < 80 ? 'text-yellow-400' : 'text-green-400'} font-medium`}>
                {getStrengthLabel(strengthScore)}
              </span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getStrengthColor(strengthScore)}`}
                initial={{ width: 0 }}
                animate={{ width: `${strengthScore}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[10px] text-gray-600 px-1">
              需至少 8 字，含大小寫字母、數字、特殊符號
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="確認密碼"
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            name="keylio-wallet-pwd-confirm"
            className={`bg-white/5 border-white/10 h-12 rounded-xl ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : ''}`}
          />
          {/* Fixed height container to prevent layout shift */}
          <div className="h-4 px-1">
            {confirmPassword && password !== confirmPassword ? <p className="text-xs text-red-400 text-right">密碼不一致</p> : null}
          </div>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!isPasswordValid}
        className="w-full bg-white text-black hover:bg-gray-200 h-12 text-base font-medium mt-8 rounded-xl transition-all disabled:opacity-50"
      >
        繼續設定 PassKey
      </Button>
    </motion.div>
  );
});

interface PasskeyStepProps {
  passkeys: PasskeyMetadata[];
  passkeyEditor: ReturnType<typeof usePasskeyEditor>;
  isProcessing: boolean;
  onAddPasskey: () => void;
  onSavePasskeyName: (id: string) => void;
  onRemovePasskey: (id: string) => void;
  onBack: () => void;
  onComplete: () => void;
}

const PasskeyStep = memo(function PasskeyStep({
  passkeys,
  passkeyEditor,
  isProcessing,
  onAddPasskey,
  onSavePasskeyName,
  onRemovePasskey,
  onBack,
  onComplete,
}: PasskeyStepProps) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-teal-500/20">
          <Fingerprint className="w-7 h-7 text-teal-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">新增生物識別認證</h3>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">
          用你的臉或指紋登入
        </p>
      </div>

      {/* Passkey List & Empty State */}
      <div className="space-y-3 flex-1 overflow-y-auto max-h-60 pr-1">
        <AnimatePresence mode="popLayout">
          {passkeys.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group h-32"
              onClick={onAddPasskey}
            >
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-teal-400" />
              </div>
              <p className="font-medium text-teal-400">新增 PassKey</p>
            </motion.div>
          ) : (
            passkeys.map((pk) => (
              <motion.div
                key={pk.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-white/10 transition-colors"
              >
                {passkeyEditor.editingPasskeyId === pk.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                    </div>
                    <Input
                      ref={passkeyEditor.editInputRef}
                      value={passkeyEditor.editingName}
                      onChange={(e) => passkeyEditor.setEditingName(e.target.value)}
                      className="h-8 bg-black/20 border-white/10 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSavePasskeyName(pk.id);
                        if (e.key === 'Escape') passkeyEditor.cancelEditing();
                      }}
                    />
                    <button onClick={() => onSavePasskeyName(pk.id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded">
                      <Check size={14} />
                    </button>
                    <button onClick={passkeyEditor.cancelEditing} className="p-1.5 text-gray-400 hover:bg-white/10 rounded">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-white text-sm truncate">{pk.name}</div>
                        <div className="text-[10px] text-gray-500">剛剛新增</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => passkeyEditor.startEditing(pk)}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        title="重新命名"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onRemovePasskey(pk.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="刪除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Add Another Device */}
        {passkeys.length > 0 && !passkeyEditor.editingPasskeyId && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onAddPasskey}
            className="w-full py-2 text-xs text-gray-500 hover:text-teal-400 border border-dashed border-white/10 hover:border-teal-500/30 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Plus size={12} /> 新增其他裝置
          </motion.button>
        )}
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
        <Button variant="ghost" onClick={onBack} className="flex-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
          上一步
        </Button>
        <Button
          onClick={onComplete}
          disabled={isProcessing || passkeys.length === 0 || !!passkeyEditor.editingPasskeyId}
          className="flex-2 bg-white text-black hover:bg-gray-200 rounded-xl"
        >
          {isProcessing ? "處理中..." : "完成設定"}
        </Button>
      </div>
    </motion.div>
  );
});
