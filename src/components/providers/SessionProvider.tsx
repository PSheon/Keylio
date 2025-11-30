"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { sessionManager } from "@/lib/session";

// ========================================
// Types
// ========================================

interface SessionContextValue {
  /** Session 是否活躍 */
  isActive: boolean;
  /** Session 是否有儲存加密密碼 */
  hasStoredPassword: boolean;
  /** 剩餘時間（毫秒） */
  timeRemaining: number;
  /** 建立 Session */
  createSession: (password: string) => Promise<void>;
  /** 銷毀 Session */
  destroySession: () => void;
  /** 記錄活動 */
  recordActivity: () => void;
  /** 儲存加密密碼到 Session */
  storeEncryptedPassword: (password: string) => Promise<void>;
  /** 從 Session 取得解密後的密碼 */
  getDecryptedPassword: () => Promise<string | null>;
}

// ========================================
// Context
// ========================================

const SessionContext = createContext<SessionContextValue | null>(null);

// ========================================
// Provider
// ========================================

interface SessionProviderProps {
  children: ReactNode;
  /** Session 過期時的回調 */
  onSessionExpired?: () => void;
}

export function SessionProvider({ children, onSessionExpired }: SessionProviderProps) {
  const [isActive, setIsActive] = useState(() => sessionManager.isActive());
  const [hasStoredPassword, setHasStoredPassword] = useState(() => sessionManager.hasStoredPassword());
  const [timeRemaining, setTimeRemaining] = useState(() => sessionManager.getTimeRemaining());

  // 定期檢查 session 狀態
  useEffect(() => {
    const interval = setInterval(() => {
      const active = sessionManager.isActive();
      const hasPassword = sessionManager.hasStoredPassword();
      const remaining = sessionManager.getTimeRemaining();

      setIsActive(active);
      setHasStoredPassword(hasPassword);
      setTimeRemaining(remaining);

      // 檢測 session 過期
      if (!active && hasStoredPassword && onSessionExpired) {
        onSessionExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onSessionExpired, hasStoredPassword]);

  // 建立 Session
  const createSession = useCallback(async (password: string) => {
    await sessionManager.createSession(password);
    setIsActive(true);
  }, []);

  // 銷毀 Session
  const destroySession = useCallback(() => {
    sessionManager.destroy(false);
    setIsActive(false);
    setHasStoredPassword(false);
  }, []);

  // 記錄活動
  const recordActivity = useCallback(() => {
    sessionManager.recordActivity();
  }, []);

  // 儲存加密密碼（並立即更新狀態）
  const storeEncryptedPassword = useCallback(async (password: string) => {
    await sessionManager.storeEncryptedPassword(password);
    // 立即更新狀態，不等 interval
    setHasStoredPassword(true);
  }, []);

  // 取得解密後的密碼
  const getDecryptedPassword = useCallback(async () => {
    return sessionManager.getDecryptedPassword();
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      isActive,
      hasStoredPassword,
      timeRemaining,
      createSession,
      destroySession,
      recordActivity,
      storeEncryptedPassword,
      getDecryptedPassword,
    }),
    [
      isActive,
      hasStoredPassword,
      timeRemaining,
      createSession,
      destroySession,
      recordActivity,
      storeEncryptedPassword,
      getDecryptedPassword,
    ]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// ========================================
// Hook
// ========================================

/**
 * 使用 Session Context
 * 必須在 SessionProvider 內使用
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
}
