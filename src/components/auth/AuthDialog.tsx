"use client";

import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthVerification, type AuthVerificationProps } from "./AuthVerification";

export interface AuthDialogProps extends Omit<AuthVerificationProps, 'onSuccess'> {
  /** Dialog 是否開啟 */
  open: boolean;
  /** 開關狀態改變時的回調 */
  onOpenChange: (open: boolean) => void;
  /** 驗證成功後的回調（不需要密碼時使用） */
  onSuccess: () => void;
  /** 驗證成功後的回調（需要密碼時使用） */
  onSuccessWithPassword?: (password: string) => void;
  /** 是否使用動畫頭部樣式 */
  animatedHeader?: boolean;
}

/**
 * 身份驗證 Dialog
 * 包裝 AuthVerification 元件，提供 Dialog 外殼
 *
 * @example
 * // 不需要密碼的場景（如確認交易）
 * <AuthDialog
 *   open={showAuth}
 *   onOpenChange={setShowAuth}
 *   onSuccess={handleConfirm}
 *   description="請驗證身份以確認交易"
 * />
 *
 * @example
 * // 需要密碼的場景（如備份助記詞）
 * <AuthDialog
 *   open={showAuth}
 *   onOpenChange={setShowAuth}
 *   onSuccess={() => {}}
 *   onSuccessWithPassword={(pwd) => decryptMnemonic(pwd)}
 *   requirePassword
 * />
 */
function AuthDialogComponent({
  open,
  onOpenChange,
  onSuccess,
  onSuccessWithPassword,
  animatedHeader = true,
  title = "安全驗證",
  description,
  requirePassword = false,
}: AuthDialogProps) {
  const [internalKey, setInternalKey] = useState(0);

  // 關閉時重置內部狀態
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // 延遲重置以避免視覺閃爍
      setTimeout(() => {
        setInternalKey(prev => prev + 1);
      }, 200);
    }
  }, [onOpenChange]);

  // 處理驗證成功
  const handleSuccess = useCallback((password: string) => {
    handleOpenChange(false);
    if (requirePassword && onSuccessWithPassword) {
      onSuccessWithPassword(password);
    } else {
      onSuccess();
    }
  }, [handleOpenChange, requirePassword, onSuccessWithPassword, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-keylio-bg-secondary border-keylio-border-primary sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>

        {animatedHeader ? (
          <div className="text-center mb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-14 h-14 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto"
            >
              <Lock className="w-7 h-7 text-teal-400" />
            </motion.div>
            {description ? (
              <p className="text-sm text-keylio-text-muted mt-3">{description}</p>
            ) : null}
          </div>
        ) : null}

        <AuthVerification
          key={internalKey}
          onSuccess={handleSuccess}
          requirePassword={requirePassword}
          title="" // 使用 DialogTitle，避免重複
          description={animatedHeader ? undefined : description}
        />
      </DialogContent>
    </Dialog>
  );
}

export const AuthDialog = memo(AuthDialogComponent);
