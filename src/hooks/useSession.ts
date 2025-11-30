"use client";

/**
 * useSession Hook
 *
 * React hook for session management with automatic state updates.
 * Provides reactive session status, timeout tracking, and password storage.
 *
 * @module hooks/useSession
 */

import { useCallback, useEffect, useState } from "react";
import { sessionManager } from "@/lib/session";

/**
 * Hook for managing user session state.
 *
 * @example
 * ```tsx
 * const { isActive, timeRemaining, createSession, destroySession } = useSession();
 *
 * if (!isActive) {
 *   return <UnlockScreen onUnlock={createSession} />;
 * }
 * ```
 */
export function useSession() {
  const [isActive, setIsActive] = useState(sessionManager.isActive());
  const [timeRemaining, setTimeRemaining] = useState(
    sessionManager.getTimeRemaining()
  );
  const [hasPassword, setHasPassword] = useState(
    sessionManager.hasStoredPassword()
  );

  useEffect(() => {
    // Check session status periodically
    const interval = setInterval(() => {
      const active = sessionManager.isActive();
      setIsActive(active);
      setTimeRemaining(sessionManager.getTimeRemaining());
      // Also check if password is stored (reactive update)
      setHasPassword(sessionManager.hasStoredPassword());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /** Create a new session with password */
  const createSession = useCallback(async (password: string) => {
    await sessionManager.createSession(password);
    setIsActive(true);
  }, []);

  /** Destroy current session */
  const destroySession = useCallback(() => {
    sessionManager.destroy(false);
    setIsActive(false);
    setHasPassword(false);
  }, []);

  /** Record user activity to extend session */
  const recordActivity = useCallback(() => {
    sessionManager.recordActivity();
  }, []);

  /** Store encrypted password in session */
  const storePassword = useCallback(async (password: string) => {
    await sessionManager.storeEncryptedPassword(password);
    setHasPassword(true);
  }, []);

  return {
    /** Whether session is currently active */
    isActive,
    /** Time remaining until auto-lock (ms) */
    timeRemaining,
    /** Create a new session */
    createSession,
    /** Destroy current session */
    destroySession,
    /** Record user activity */
    recordActivity,
    /** Encrypt data using session key */
    encrypt: sessionManager.encrypt.bind(sessionManager),
    /** Decrypt data using session key */
    decrypt: sessionManager.decrypt.bind(sessionManager),
    /** Store encrypted password in session */
    storeEncryptedPassword: storePassword,
    /** Get decrypted password from session */
    getDecryptedPassword: sessionManager.getDecryptedPassword.bind(sessionManager),
    /** Whether session has stored password */
    hasStoredPassword: useCallback(() => hasPassword, [hasPassword]),
  };
}

export default useSession;
