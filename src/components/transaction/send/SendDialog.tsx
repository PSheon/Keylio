"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KeylioError, ErrorCode } from "@/lib/errors";
import { showSuccess, showError } from "@/lib/toast";
import { getTokenValueUSD } from "@/lib/tokens";
import { sendTransactionWithSession, validateTransaction } from "@/lib/transaction";
import { useWalletStore } from "@/stores/useWalletStore";
import { SendingAnimation } from "./SendingAnimation";
import { StepIndicator } from "./StepIndicator";
import { AmountStep } from "./steps/AmountStep";
import { ConfirmStep } from "./steps/ConfirmStep";
import { RecipientStep } from "./steps/RecipientStep";
import { SuccessAnimation } from "./SuccessAnimation";
import type { SendStep, SendFormData, SendResult } from "./types";

interface SendDialogProps {
  fromAddress: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  onReceive?: () => void; // 當用戶無餘額時導向接收
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultRecipient?: string;
  defaultRecipientName?: string;
}

const STEP_ORDER: SendStep[] = ['recipient', 'amount', 'confirm'];

/**
 * 發送 Dialog - 重構版
 * 3 步驟流程：收款人 → 金額 → 確認
 */
export function SendDialog({
  fromAddress,
  trigger,
  onSuccess,
  onReceive,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultRecipient = "",
  defaultRecipientName = "",
}: SendDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  // 處理 Dialog 開關，關閉時重置表單
  const handleOpenChange = useCallback((open: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(open);
    } else {
      setInternalOpen(open);
    }

    // 關閉時重置所有狀態
    if (!open) {
      setTimeout(() => {
        setStep('recipient');
        setFormData({
          recipient: defaultRecipient,
          recipientName: defaultRecipientName,
          token: "USDT",
          amount: "",
          note: "",
        });
        setResult(null);
        setIsProcessing(false);
      }, 300);
    }
  }, [controlledOnOpenChange, defaultRecipient, defaultRecipientName]);

  const [step, setStep] = useState<SendStep>('recipient');
  const [formData, setFormData] = useState<SendFormData>({
    recipient: defaultRecipient,
    recipientName: defaultRecipientName,
    token: "USDT",
    amount: "",
    note: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const getCurrentWallet = useWalletStore((state) => state.getCurrentWallet);
  const currentWallet = getCurrentWallet();
  const walletIndex = currentWallet?.index ?? 0;

  const currentStepIndex = STEP_ORDER.indexOf(step as typeof STEP_ORDER[number]);

  const updateFormData = useCallback((data: Partial<SendFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const handleConfirm = async () => {
    // 驗證已在 ConfirmStep 內完成，這裡直接進入發送流程
    setStep('sending');
    setIsProcessing(true);

    try {
      // 1. 驗證交易
      const validation = await validateTransaction(fromAddress, {
        to: formData.recipient,
        amount: formData.amount,
        tokenAddress: undefined, // Will be resolved by token symbol
        note: formData.note,
      });

      if (!validation.isValid) {
        showError("交易驗證失敗", validation.error || undefined);
        setStep('confirm');
        setIsProcessing(false);
        return;
      }

      // 2. 發送交易
      const txResult = await sendTransactionWithSession(walletIndex, {
        to: formData.recipient,
        amount: formData.amount,
        tokenAddress: undefined,
        note: formData.note,
        label: formData.recipientName || undefined,
      });

      setResult({
        hash: txResult.hash,
        timestamp: Date.now(),
      });
      setStep('success');
      showSuccess("發送成功");
      onSuccess?.();
    } catch (error) {
      console.error(error);
      setStep('confirm');

      if (error instanceof KeylioError) {
        switch (error.code) {
          case ErrorCode.AUTH_SESSION_EXPIRED:
            showError("會話已過期", "請重新登入");
            break;
          case ErrorCode.TX_INSUFFICIENT_BALANCE:
            showError("餘額不足");
            break;
          default:
            showError("發送失敗", error.message);
        }
      } else {
        showError("發送失敗或已取消");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const valueUSD = getTokenValueUSD(formData.amount || "0", formData.token);

  // 取得步驟標題
  const getStepTitle = () => {
    switch (step) {
      case 'recipient': return '選擇收款人';
      case 'amount': return '輸入金額';
      case 'confirm': return '確認發送';
      case 'sending': return '發送中';
      case 'success': return '完成';
      default: return '發送';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>發送</Button>}
      </DialogTrigger>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary sm:max-w-[400px] md:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          {/* 步驟指示器 - 只在前三步顯示 */}
          {currentStepIndex >= 0 && step !== 'sending' && step !== 'success' ? (
            <StepIndicator currentStep={currentStepIndex} totalSteps={3} />
          ) : null}
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'recipient' && (
              <RecipientStep
                data={formData}
                onUpdate={updateFormData}
                onNext={() => setStep('amount')}
              />
            )}

            {step === 'amount' && (
              <AmountStep
                data={formData}
                fromAddress={fromAddress}
                onUpdate={updateFormData}
                onNext={() => setStep('confirm')}
                onBack={() => setStep('recipient')}
                onReceive={() => {
                  reset();
                  onReceive?.();
                }}
              />
            )}

            {step === 'confirm' && (
              <ConfirmStep
                data={formData}
                fromAddress={fromAddress}
                onConfirm={handleConfirm}
                onBack={() => setStep('amount')}
                isProcessing={isProcessing}
              />
            )}

            {step === 'sending' && (
              <SendingAnimation token={formData.token} amount={formData.amount} />
            )}

            {step === 'success' && result ? (
              <SuccessAnimation
                amount={formData.amount}
                token={formData.token}
                valueUSD={valueUSD}
                recipientName={formData.recipientName}
                result={result}
                onDone={reset}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
