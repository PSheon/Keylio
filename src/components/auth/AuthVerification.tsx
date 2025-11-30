"use client";

import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Lock } from "lucide-react";
import db, { type PasskeyMetadata } from "@/lib/storage/db";
import { decryptData, type EncryptedData } from "@/lib/crypto";
import { authenticatePasskey } from "@/lib/passkey";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

export interface AuthVerificationProps {
  /**
   * 驗證成功時的回調
   * @param password - 驗證成功後的密碼（用於解密操作）
   */
  onSuccess: (password: string) => void;
  /**
   * 是否需要返回密碼（用於需要解密的場景）
   * 如果為 false，Passkey 驗證不需要 session 中有密碼
   */
  requirePassword?: boolean;
  /**
   * 標題
   */
  title?: string;
  /**
   * 描述
   */
  description?: string;
}

/**
 * 共用的身份驗證組件
 * 支援 Passkey 和密碼兩種驗證方式
 */
function AuthVerificationComponent({
  onSuccess,
  requirePassword = true,
  title = "安全驗證",
  description,
}: AuthVerificationProps) {
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Use session context for reactive state
  const {
    isActive: sessionIsActive,
    hasStoredPassword: sessionHasPassword,
    createSession,
    storeEncryptedPassword,
    getDecryptedPassword,
  } = useSessionContext();

  // Fetch passkey metadata
  const passkeys = useLiveQuery(async () => {
    const setting = await db.settings.get({ key: "passkeys_metadata" });
    return (setting?.value as PasskeyMetadata[]) || [];
  });

  // Get default Passkey
  const defaultPasskey = passkeys?.find((pk) => pk.isDefault) || null;
  const passkeyCount = passkeys?.length ?? 0;

  // Handle Passkey authentication
  const handlePasskeyAuth = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      // Authenticate with Passkey
      const result = defaultPasskey?.credentialId
        ? await authenticatePasskey(defaultPasskey.credentialId).catch(() => {
            toast.info("預設 Passkey 無法使用，請選擇其他");
            return authenticatePasskey();
          })
        : await authenticatePasskey();

      // Update last used timestamp
      if (result.credentialId && passkeys) {
        const updatedPasskeys = passkeys.map((pk) =>
          pk.credentialId === result.credentialId
            ? { ...pk, lastUsed: Date.now() }
            : pk
        );
        const existingSetting = await db.settings.get({
          key: "passkeys_metadata",
        });
        await db.settings.put({
          id: existingSetting?.id,
          key: "passkeys_metadata",
          value: updatedPasskeys,
        });
      }

      if (requirePassword) {
        // Get password from session
        const pwd = await getDecryptedPassword();
        if (!pwd) {
          toast.error("Session 已過期，請使用密碼驗證");
          setShowPasswordInput(true);
          return;
        }
        onSuccess(pwd);
      } else {
        // Just verify identity, no password needed
        onSuccess("");
      }
      
      toast.success("驗證成功");
    } catch (error) {
      console.error("Passkey auth failed:", error);
      toast.error("Passkey 驗證失敗，請使用密碼驗證");
      setShowPasswordInput(true);
    } finally {
      setIsAuthenticating(false);
    }
  }, [defaultPasskey, passkeys, requirePassword, onSuccess, getDecryptedPassword]);

  // Handle password authentication
  const handlePasswordAuth = useCallback(async () => {
    if (!authPassword) {
      toast.error("請輸入密碼");
      return;
    }

    setIsAuthenticating(true);
    try {
      // Verify password by decrypting mnemonic
      const setting = await db.settings.get({ key: "encrypted_mnemonic" });
      if (!setting) throw new Error("No mnemonic found");

      await decryptData(setting.value as EncryptedData, authPassword);

      // Create session if not active, then store password
      // This ensures Passkey-based operations can retrieve the password later
      if (!sessionIsActive) {
        await createSession(authPassword);
      }
      await storeEncryptedPassword(authPassword);

      onSuccess(authPassword);
      setAuthPassword("");
      toast.success("驗證成功");
    } catch {
      toast.error("密碼錯誤");
    } finally {
      setIsAuthenticating(false);
    }
  }, [authPassword, onSuccess, sessionIsActive, createSession, storeEncryptedPassword]);

  // Determine description text
  const displayDescription =
    description ??
    (passkeyCount > 0
      ? `已設定 ${passkeyCount} 組裝置`
      : "請驗證以繼續");

  return (
    <div className="py-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-teal-400" />
        </div>
        <p className="text-keylio-text-primary font-medium">{title}</p>
        <p className="text-sm text-keylio-text-secondary mt-1">
          {displayDescription}
        </p>
      </div>

      {!showPasswordInput && passkeyCount > 0 ? (
        // Passkey authentication (primary)
        <div className="space-y-4">
          <Button
            onClick={handlePasskeyAuth}
            disabled={isAuthenticating || (requirePassword && !sessionHasPassword)}
            className="w-full bg-keylio-teal hover:bg-keylio-teal/80 h-12 disabled:opacity-50"
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
          {requirePassword && !sessionHasPassword && (
            <p className="text-xs text-amber-400 text-center">
              Session 已過期，請先使用密碼登入
            </p>
          )}
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
        // Password authentication
        <div className="space-y-4">
          <div>
            <Label htmlFor="auth-password">輸入密碼</Label>
            <Input
              id="auth-password"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="請輸入您的密碼"
              className="bg-keylio-bg-primary border-keylio-border-primary mt-2"
              autoComplete="off"
              data-form-type="other"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePasswordAuth();
              }}
            />
          </div>
          <Button
            onClick={handlePasswordAuth}
            disabled={isAuthenticating || !authPassword}
            className="w-full bg-keylio-teal hover:bg-keylio-teal/80 h-12"
          >
            {isAuthenticating ? "驗證中..." : "確認"}
          </Button>
          {passkeyCount > 0 && (
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
  );
}

export const AuthVerification = memo(AuthVerificationComponent);
