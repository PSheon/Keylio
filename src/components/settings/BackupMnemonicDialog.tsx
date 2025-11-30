"use client";

import { memo, useState, useCallback } from "react";
import {
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Lock,
} from "lucide-react";
import { AuthVerification } from "@/components/auth/AuthVerification";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { decryptData, type EncryptedData } from "@/lib/crypto";
import db from "@/lib/storage/db";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface BackupMnemonicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "auth" | "warning" | "reveal" | "verify";

/**
 * 備份助記詞 Dialog
 * 包含驗證、警告、顯示、驗證確認四個步驟
 *
 * 支援兩種驗證方式：
 * 1. Passkey 驗證（如果 session 中有儲存密碼）
 * 2. 密碼驗證（備用選項）
 */
function BackupMnemonicDialogComponent({
  open,
  onOpenChange,
}: BackupMnemonicDialogProps) {
  const [step, setStep] = useState<Step>("auth");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string }[]>([]);
  const [userInputs, setUserInputs] = useState<string[]>(["", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);

  const resetDialog = useCallback(() => {
    setStep("auth");
    setMnemonic([]);
    setShowMnemonic(false);
    setCopied(false);
    setVerifyWords([]);
    setUserInputs(["", "", ""]);
    setIsVerifying(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetDialog();
      onOpenChange(open);
    },
    [onOpenChange, resetDialog]
  );

  // 生成驗證用的隨機索引
  const generateVerifyIndices = useCallback((words: string[]) => {
    const indices: number[] = [];
    while (indices.length < 3) {
      const idx = Math.floor(Math.random() * words.length);
      if (!indices.includes(idx)) {
        indices.push(idx);
      }
    }
    indices.sort((a, b) => a - b);
    return indices.map((idx) => ({ index: idx, word: words[idx] }));
  }, []);

  // Handle authentication success - decrypt mnemonic with password
  const handleAuthSuccess = useCallback(async (password: string) => {
    try {
      const setting = await db.settings.get({ key: "encrypted_mnemonic" });
      if (!setting) throw new Error("No mnemonic found");

      const decrypted = await decryptData(setting.value as EncryptedData, password);
      const words = decrypted.split(" ");
      setMnemonic(words);
      setVerifyWords(generateVerifyIndices(words));
      setStep("warning");
    } catch (error) {
      console.error("Failed to decrypt mnemonic:", error);
      showError("解密助記詞失敗");
    }
  }, [generateVerifyIndices]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(mnemonic.join(" "));
    setCopied(true);
    showSuccess("已複製到剪貼簿");
    setTimeout(() => setCopied(false), 2000);
  }, [mnemonic]);

  const handleVerify = useCallback(() => {
    setIsVerifying(true);

    const isCorrect = verifyWords.every(
      (vw, idx) => userInputs[idx].toLowerCase().trim() === vw.word.toLowerCase()
    );

    if (isCorrect) {
      showSuccess("備份驗證成功", "請妥善保管您的助記詞");
      handleOpenChange(false);
    } else {
      showError("驗證失敗", "請重新輸入");
      setUserInputs(["", "", ""]);
    }

    setIsVerifying(false);
  }, [verifyWords, userInputs, handleOpenChange]);

  const renderAuthStep = () => (
    <DialogBody>
      <AuthVerification
        onSuccess={handleAuthSuccess}
        requirePassword={true}
        title="安全驗證"
        description="請驗證以查看助記詞"
      />
    </DialogBody>
  );

  const renderWarningStep = () => (
    <>
      <DialogBody className="py-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-keylio-text-primary font-medium text-lg">重要安全提醒</p>
        </div>

        <div className="space-y-4 text-sm text-keylio-text-secondary">
          <div className="flex gap-3 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-red-400">絕對不要</strong>
              將助記詞分享給任何人，包括 Keylio 團隊成員
            </p>
          </div>

          <div className="flex gap-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              任何擁有您助記詞的人都可以
              <strong className="text-amber-400">完全控制您的資產</strong>
            </p>
          </div>

          <div className="flex gap-3 p-3 bg-keylio-bg-tertiary rounded-lg border border-keylio-border-primary">
            <Lock className="w-5 h-5 text-keylio-text-muted shrink-0 mt-0.5" />
            <p>
              建議使用紙筆抄寫並存放在安全的地方，
              <strong className="text-keylio-text-primary">避免數位儲存</strong>
            </p>
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="border-t border-keylio-border-primary pt-4">
        <Button
          variant="outline"
          onClick={() => handleOpenChange(false)}
          className="flex-1 border-keylio-border-primary text-keylio-text-secondary"
        >
          取消
        </Button>
        <Button
          onClick={() => setStep("reveal")}
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
        >
          我已了解，繼續
        </Button>
      </DialogFooter>
    </>
  );

  const renderRevealStep = () => (
    <>
      <DialogBody className="py-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-keylio-text-secondary">
              您的 {mnemonic.length} 個助記詞
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="text-keylio-text-muted hover:text-keylio-text-primary"
              >
                {showMnemonic ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-keylio-text-muted hover:text-keylio-text-primary"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {mnemonic.map((word, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-keylio-bg-primary p-2 rounded-lg border border-keylio-border-primary"
              >
                <span className="text-xs text-keylio-text-muted w-5">
                  {idx + 1}.
                </span>
                <span
                  className={cn(
                    "text-sm font-mono",
                    showMnemonic
                      ? "text-keylio-text-primary"
                      : "text-transparent bg-keylio-bg-tertiary rounded select-none"
                  )}
                >
                  {showMnemonic ? word : "••••••"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20">
          <p className="text-xs text-amber-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            請按順序抄寫這些助記詞，確保順序正確且無拼寫錯誤
          </p>
        </div>
      </DialogBody>

      <DialogFooter className="border-t border-keylio-border-primary pt-4">
        <Button
          variant="outline"
          onClick={() => setStep("warning")}
          className="flex-1 border-keylio-border-primary text-keylio-text-secondary"
        >
          返回
        </Button>
        <Button
          onClick={() => setStep("verify")}
          className="flex-1 bg-keylio-teal hover:bg-keylio-teal/80"
        >
          我已抄寫完成
        </Button>
      </DialogFooter>
    </>
  );

  const renderVerifyStep = () => (
    <>
      <DialogBody className="py-4">
        <div className="text-center mb-6">
          <p className="text-keylio-text-primary font-medium">驗證您的備份</p>
          <p className="text-sm text-keylio-text-secondary mt-1">
            請依序填入以下位置的助記詞
          </p>
        </div>

        <div className="space-y-4">
          {verifyWords.map((vw, idx) => (
            <div key={vw.index}>
              <Label className="text-keylio-text-secondary text-sm">
                第 {vw.index + 1} 個單字
              </Label>
              <Input
                type="text"
                value={userInputs[idx]}
                onChange={(e) => {
                  const newInputs = [...userInputs];
                  newInputs[idx] = e.target.value;
                  setUserInputs(newInputs);
                }}
                placeholder={`請輸入第 ${vw.index + 1} 個單字`}
                className="bg-keylio-bg-primary border-keylio-border-primary mt-1"
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      </DialogBody>

      <DialogFooter className="border-t border-keylio-border-primary pt-4">
        <Button
          variant="outline"
          onClick={() => setStep("reveal")}
          className="flex-1 border-keylio-border-primary text-keylio-text-secondary"
        >
          返回查看
        </Button>
        <Button
          onClick={handleVerify}
          disabled={
            isVerifying || userInputs.some((input) => !input.trim())
          }
          className="flex-1 bg-keylio-teal hover:bg-keylio-teal/80"
        >
          {isVerifying ? "驗證中..." : "確認"}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>備份助記詞</DialogTitle>
          <DialogDescription>
            助記詞是恢復錢包的唯一方式，請妥善保管
          </DialogDescription>
        </DialogHeader>

        {step === "auth" && renderAuthStep()}
        {step === "warning" && renderWarningStep()}
        {step === "reveal" && renderRevealStep()}
        {step === "verify" && renderVerifyStep()}
      </DialogContent>
    </Dialog>
  );
}

export const BackupMnemonicDialog = memo(BackupMnemonicDialogComponent);
