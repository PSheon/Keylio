"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, ShieldCheck, Fingerprint, Wallet, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/stores/useWalletStore";
import { deriveWallet, encryptData } from "@/lib/crypto";
import { usePasskeyManager } from "@/hooks/usePasskeyManager";
import { usePasskeyEditor } from "@/hooks/usePasskeyEditor";
import db from "@/lib/storage/db";

import type { PasskeyMetadata } from "@/lib/storage/db";
interface WalletSetupWizardProps {
  onComplete: () => void;
}

export function WalletSetupWizard({ onComplete }: WalletSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [passkeys, setPasskeys] = useState<PasskeyMetadata[]>([]);
  
  const passkeyManager = usePasskeyManager();
  const passkeyEditor = usePasskeyEditor();

  const tempMnemonic = useWalletStore((state) => state.tempMnemonic);
  const setWallets = useWalletStore((state) => state.setWallets);
  const setUnlocked = useWalletStore((state) => state.setUnlocked);
  const clearTempMnemonic = useWalletStore((state) => state.clearTempMnemonic);
  const setSessionPassword = useWalletStore((state) => state.setSessionPassword);

  useEffect(() => {
    if (step === 1) {
      const timer = setTimeout(() => document.getElementById("wallet-name-input")?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[a-z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 20;
    if (/[!@#$%^&*]/.test(pwd)) score += 20;
    return score;
  };

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

  const handleStep2 = () => {
    if (!isPasswordValid) {
      toast.error("請確認密碼強度符合要求且兩次輸入一致");
      return;
    }
    setStep(3);
  };

  const handleAddPasskey = async () => {
    const existingCredentialIds = passkeys.map(pk => pk.credentialId);
    const newPasskey = await passkeyManager.addPasskey(undefined, existingCredentialIds);
    if (newPasskey) {
      setPasskeys([...passkeys, newPasskey]);
    }
  };

  const handleStep1 = () => {
    if (!name.trim()) {
      toast.error("請輸入錢包名稱");
      return;
    }
    setStep(2);
  };

  const savePasskeyName = async (id: string) => {
    const existingNames = passkeys.filter(p => p.id !== id).map(p => p.name);
    const success = await passkeyManager.updatePasskeyName(id, passkeyEditor.editingName, existingNames);
    if (success) {
      setPasskeys(passkeys.map(p => p.id === id ? { ...p, name: passkeyEditor.editingName.trim() } : p));
      passkeyEditor.resetEditing();
    }
  };

  const removePasskey = async (id: string) => {
    const success = await passkeyManager.removePasskey(id);
    if (success) {
      setPasskeys(passkeys.filter(p => p.id !== id));
    }
  };

  const handleCompleteSetup = async () => {
    if (!tempMnemonic) {
      toast.error("發生錯誤：助記詞遺失，請重新開始");
      return;
    }

    if (passkeys.length === 0) {
      toast.error("請至少設定一個 Passkey");
      return;
    }

    setIsProcessing(true);
    try {
      const encryptedData = await encryptData(tempMnemonic, password);
      const wallet = deriveWallet(tempMnemonic, 0);

      await db.transaction('rw', db.settings, db.sub_wallets, async () => {
        // Get existing records to preserve IDs (prevents ConstraintError)
        const existingMnemonic = await db.settings.get({ key: 'encrypted_mnemonic' });
        const existingPasskeys = await db.settings.get({ key: 'passkeys_metadata' });

        await db.settings.put({ 
          id: existingMnemonic?.id,
          key: 'encrypted_mnemonic', 
          value: encryptedData 
        });
        await db.settings.put({ 
          id: existingPasskeys?.id,
          key: 'passkeys_metadata', 
          value: passkeys 
        });

        const subWallet = {
          name: name,
          address: wallet.address,
          index: 0,
          color: '#14b8a6',
          emoji: '💼',
          createdAt: Date.now(),
        };
        const id = await db.sub_wallets.add(subWallet);
        setWallets([{ ...subWallet, id }]);
      });

      setSessionPassword(password);
      setUnlocked(true);
      clearTempMnemonic();
      toast.success("錢包創建成功！");
      onComplete();

    } catch (error) {
      console.error(error);
      toast.error("創建失敗，請重試");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 relative overflow-hidden font-sans">
      {/* Background Effects - More subtle/minimal */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-900/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[150px]" />
      </div>

      <Card className="w-full max-w-md bg-[#0a0e17] border border-white/10 text-white relative z-10 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="pb-2 border-b border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 tracking-wider uppercase">Setup Wizard</span>
            <span className="text-xs text-gray-500 font-mono">{step} / 3</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-1 bg-white/5 *:bg-teal-500" />
        </CardHeader>
        
        <CardContent className="pt-8 min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"
                  >
                    <Wallet className="w-8 h-8 text-teal-400" strokeWidth={1.5} />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-white tracking-tight">
                      為您的錢包命名
                    </h3>
                    <p className="text-gray-400 text-sm">
                      這將是您識別此錢包的名稱
                    </p>
                  </div>

                  <div className="w-full max-w-xs mx-auto">
                    <Input
                      id="wallet-name-input"
                      placeholder="例如：我的主錢包"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-transparent border-0 border-b border-white/20 rounded-none px-0 text-center text-xl focus:ring-0 focus:border-teal-500 placeholder:text-gray-700 transition-colors h-12"
                      onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleStep1} 
                  className="w-full bg-white text-black hover:bg-gray-200 h-12 text-base font-medium mt-8 rounded-xl transition-all"
                >
                  下一步
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">設定安全密碼</h3>
                  <p className="text-sm text-gray-400">用於加密您的助記詞與私鑰</p>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <div className="relative group">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="輸入密碼"
                        className="bg-white/5 border-white/10 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 pr-10 h-12 rounded-xl transition-all"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-500 hover:text-white transition-colors"
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次確認密碼"
                      className={`bg-white/5 border-white/10 h-12 rounded-xl ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : ''}`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-400 text-right px-1">密碼不一致</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                    上一步
                  </Button>
                  <Button 
                    onClick={handleStep2} 
                    disabled={!isPasswordValid}
                    className="flex-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 rounded-xl"
                  >
                    下一步
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <div className="text-center mb-6">
                  <div className="mx-auto w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-teal-500/20">
                    <Fingerprint className="w-7 h-7 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">設定 Passkey</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    使用生物辨識快速存取
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
                        onClick={handleAddPasskey}
                      >
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Plus className="w-5 h-5 text-teal-400" />
                        </div>
                        <p className="font-medium text-teal-400">註冊此裝置</p>
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
                                  if (e.key === 'Enter') savePasskeyName(pk.id);
                                  if (e.key === 'Escape') passkeyEditor.cancelEditing();
                                }}
                              />
                              <button onClick={() => savePasskeyName(pk.id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded">
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
                                  onClick={() => removePasskey(pk.id)}
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

                  {/* Add Another Device (Small Button) */}
                  {passkeys.length > 0 && !passkeyEditor.editingPasskeyId && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleAddPasskey}
                      className="w-full py-2 text-xs text-gray-500 hover:text-teal-400 border border-dashed border-white/10 hover:border-teal-500/30 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <Plus size={12} /> 新增其他裝置
                    </motion.button>
                  )}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">
                    上一步
                  </Button>
                  <Button
                    onClick={handleCompleteSetup}
                    disabled={isProcessing || passkeys.length === 0 || !!passkeyEditor.editingPasskeyId}
                    className="flex-2 bg-white text-black hover:bg-gray-200 rounded-xl"
                  >
                    {isProcessing ? "處理中..." : "完成設定"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
