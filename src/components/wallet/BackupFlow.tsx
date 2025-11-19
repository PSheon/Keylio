"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import db from "@/lib/storage/db";
import { decryptData } from "@/lib/crypto";
import { useLiveQuery } from "dexie-react-hooks";
import { authenticatePasskey } from "@/lib/passkey";

interface BackupFlowProps {
  onComplete: () => void;
}

export function BackupFlow({ onComplete }: BackupFlowProps) {
  const [step, setStep] = useState<'warning' | 'display' | 'verify' | 'success'>('warning');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<{[key: number]: string}>({});

  // Fetch encrypted mnemonic from DB
  const encryptedMnemonic = useLiveQuery(async () => {
    const setting = await db.settings.get({ key: 'encrypted_mnemonic' });
    return setting?.value;
  });

  const handleReveal = async () => {
    if (!encryptedMnemonic) return;
    
    if (!password) {
      toast.error("請輸入密碼");
      return;
    }

    try {
      const setting = await db.settings.get({ key: 'encrypted_mnemonic' });
      if (!setting) throw new Error("No mnemonic found");

      const decrypted = await decryptData(setting.value, password);
      setMnemonic(decrypted);
      setIsRevealed(true);
      setStep('display');
    } catch (error) {
      toast.error("密碼錯誤");
    }
  };

  const handlePasskeyReveal = async () => {
    try {
      await authenticatePasskey();
      toast.success("Passkey 驗證成功 (Demo: 請仍輸入密碼以解密)");
    } catch (error) {
      toast.error("Passkey 驗證失敗");
    }
  };

  const handleCopy = () => {
    if (mnemonic) {
      navigator.clipboard.writeText(mnemonic);
      setHasCopied(true);
      toast.success("已複製到剪貼簿");
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  const words = mnemonic ? mnemonic.split(" ") : [];

  // Generate quiz questions
  const generateQuiz = () => {
    if (!words.length) return [];
    // Pick 3 random indices
    const indices = [2, 6, 10]; // Fixed for simplicity or random
    return indices.map(idx => ({
      index: idx,
      correctWord: words[idx],
      options: [words[idx], "apple", "banana", "cherry"].sort(() => Math.random() - 0.5) // Mock options
    }));
  };

  const [questions] = useState(() => [
    { index: 2, options: [] as string[] }, 
    { index: 6, options: [] as string[] }, 
    { index: 10, options: [] as string[] }
  ]); 

  const handleVerify = () => {
    // Check answers
    const isCorrect = questions.every(q => quizAnswers[q.index] === words[q.index]);
    if (isCorrect) {
      setStep('success');
    } else {
      toast.error("驗證失敗，請檢查你的備份");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0e27] text-white p-4">
      <Card className="w-full max-w-md bg-[#141b3d] border-[#1e2749] text-white">
        <CardHeader>
          <CardTitle>備份助記詞</CardTitle>
          <CardDescription className="text-gray-400">
            助記詞是恢復錢包的唯一方式，請務必妥善保存。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {step === 'warning' && (
              <motion.div
                key="warning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                  <div className="text-sm text-red-200">
                    <p className="font-bold mb-1">⚠️ 安全警告</p>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                      <li>請確保周圍沒有攝影機</li>
                      <li>不要截圖或拍照</li>
                      <li>建議手寫在紙上並鎖在保險箱</li>
                    </ul>
                  </div>
                </div>
                <Button 
                  onClick={() => setStep('display')} 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  我已準備好
                </Button>
              </motion.div>
            )}

            {step === 'display' && (
              <motion.div
                key="display"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {!isRevealed ? (
                  <div className="space-y-4">
                    <div className="h-48 bg-[#0a0e27] rounded-lg flex flex-col items-center justify-center border border-[#1e2749]">
                      <EyeOff className="w-8 h-8 text-gray-500 mb-2" />
                      <p className="text-gray-400 text-sm">助記詞已隱藏</p>
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="輸入密碼以解鎖"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#0a0e27] border-[#1e2749]"
                      />
                      <Button onClick={handlePasskeyReveal} variant="outline" className="w-full border-[#1e2749] hover:bg-[#1e2749] hover:text-white text-gray-400">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        使用 Passkey 驗證
                      </Button>
                    </div>
                    <Button onClick={handleReveal} className="w-full bg-teal-600 hover:bg-teal-700">
                      顯示助記詞
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {words.map((word, i) => (
                        <div key={i} className="bg-[#0a0e27] p-2 rounded border border-[#1e2749] flex items-center gap-2">
                          <span className="text-gray-500 text-xs w-4">{i + 1}.</span>
                          <span className="font-mono text-sm">{word}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-[#1e2749] hover:bg-[#1e2749]"
                      onClick={handleCopy}
                    >
                      {hasCopied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {hasCopied ? "已複製" : "複製到剪貼簿"}
                    </Button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="confirmed" 
                    checked={isConfirmed}
                    onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
                    className="border-gray-600 data-[state=checked]:bg-teal-600"
                  />
                  <label
                    htmlFor="confirmed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                  >
                    我已安全地記錄這些字詞
                  </label>
                </div>

                <Button 
                  onClick={() => setStep('verify')} 
                  disabled={!isConfirmed || !isRevealed}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  下一步
                </Button>
              </motion.div>
            )}

            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <p className="text-sm text-gray-400">為了確保你已正確備份，請回答以下問題：</p>
                
                {questions.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <label className="text-sm font-medium">第 {q.index + 1} 個字是？</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[words[q.index], "apple", "banana", "cherry"].sort().map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [q.index]: opt }))}
                          className={`p-2 rounded text-sm border ${
                            quizAnswers[q.index] === opt 
                              ? "bg-teal-500/20 border-teal-500 text-teal-400" 
                              : "bg-[#0a0e27] border-[#1e2749] hover:border-gray-500"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <Button 
                  onClick={handleVerify} 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  驗證
                </Button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-8"
              >
                <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">備份完成！</h3>
                  <p className="text-gray-400 text-sm">
                    你已成功備份助記詞，現在可以安心使用錢包了。
                  </p>
                </div>
                <Button 
                  onClick={onComplete} 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  進入錢包
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
