/**
 * Keylio Wallet - Secure Session Management
 *
 * Uses Web Crypto API to derive a CryptoKey from the user's password.
 * The CryptoKey is stored in memory and cannot be read by JavaScript.
 * This is more secure than storing the plaintext password.
 */

import { useCallback,useEffect, useState } from 'react';
import { ErrorCode,KeylioError } from './errors';

// ========================================
// Types
// ========================================

interface EncryptedPassword {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

interface SessionData {
  key: CryptoKey;
  salt: Uint8Array;
  createdAt: number;
  lastActivityAt: number;
  encryptedPassword?: EncryptedPassword; // Encrypted password for sensitive operations
}

interface SessionConfig {
  autoLockMinutes: number;
  onSessionExpired?: () => void;
}

// ========================================
// Session Manager Singleton
// ========================================

class SessionManager {
  private session: SessionData | null = null;
  private config: SessionConfig = {
    autoLockMinutes: 15, // Default 15 minutes
  };
  private activityTimer: ReturnType<typeof setTimeout> | null = null;
  private visibilityHandler: (() => void) | null = null;

  /**
   * Initialize session with a password
   * Derives a CryptoKey that can be used for encryption/decryption
   */
  async createSession(password: string, salt?: Uint8Array): Promise<void> {
    const sessionSalt = salt || crypto.getRandomValues(new Uint8Array(16));

    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: sessionSalt as BufferSource,
          iterations: 100000, // Lower iterations for session key (faster)
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false, // Not extractable - key cannot be read
        ['encrypt', 'decrypt']
      );

      this.session = {
        key,
        salt: sessionSalt,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      this.startActivityMonitoring();
    } catch (error) {
      throw new KeylioError(
        ErrorCode.WALLET_ENCRYPTION_FAILED,
        { operation: 'createSession' },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if there's an active session
   */
  isActive(): boolean {
    if (!this.session) return false;

    // Check if session has expired
    const now = Date.now();
    const timeoutMs = this.config.autoLockMinutes * 60 * 1000;

    if (timeoutMs > 0 && now - this.session.lastActivityAt > timeoutMs) {
      this.destroy();
      return false;
    }

    return true;
  }

  /**
   * Get the session CryptoKey for encryption/decryption
   */
  getKey(): CryptoKey {
    if (!this.isActive()) {
      throw new KeylioError(ErrorCode.AUTH_SESSION_EXPIRED);
    }

    // Update last activity
    this.session!.lastActivityAt = Date.now();
    return this.session!.key;
  }

  /**
   * Get session salt (needed to recreate the same key)
   */
  getSalt(): Uint8Array | null {
    return this.session?.salt || null;
  }

  /**
   * Store encrypted password in session
   * Uses session key to encrypt the password for later use (e.g., decrypting mnemonic)
   * Password is cleared when session expires
   */
  async storeEncryptedPassword(password: string): Promise<void> {
    if (!this.isActive()) {
      throw new KeylioError(ErrorCode.AUTH_SESSION_EXPIRED);
    }

    const key = this.session!.key;
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      new TextEncoder().encode(password)
    );

    this.session!.encryptedPassword = { ciphertext, iv };
  }

  /**
   * Get decrypted password from session
   * Returns null if no password is stored
   */
  async getDecryptedPassword(): Promise<string | null> {
    if (!this.isActive() || !this.session?.encryptedPassword) {
      return null;
    }

    const { ciphertext, iv } = this.session.encryptedPassword;
    const key = this.session.key;

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      return null;
    }
  }

  /**
   * Check if session has stored password
   */
  hasStoredPassword(): boolean {
    return this.isActive() && !!this.session?.encryptedPassword;
  }

  /**
   * Encrypt data using the session key
   */
  async encrypt(data: string): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    const key = this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      new TextEncoder().encode(data)
    );

    return { ciphertext, iv };
  }

  /**
   * Decrypt data using the session key
   */
  async decrypt(ciphertext: ArrayBuffer, iv: Uint8Array): Promise<string> {
    const key = this.getKey();

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      throw new KeylioError(ErrorCode.WALLET_DECRYPTION_FAILED);
    }
  }

  /**
   * Update session configuration
   */
  configure(config: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart activity monitoring with new timeout
    if (this.session) {
      this.startActivityMonitoring();
    }
  }

  /**
   * Record user activity to extend session
   */
  recordActivity(): void {
    if (this.session) {
      this.session.lastActivityAt = Date.now();
      this.resetActivityTimer();
    }
  }

  /**
   * Destroy the session and clear sensitive data
   * @param notify - Whether to notify listeners (default: true)
   */
  destroy(notify: boolean = true): void {
    // Prevent infinite recursion - only proceed if session exists
    if (!this.session) return;

    // Clear encrypted password from memory
    if (this.session.encryptedPassword) {
      // Overwrite with zeros before clearing (security best practice)
      const cipherArray = new Uint8Array(this.session.encryptedPassword.ciphertext);
      cipherArray.fill(0);
      this.session.encryptedPassword.iv.fill(0);
      this.session.encryptedPassword = undefined;
    }

    this.session = null;
    this.stopActivityMonitoring();

    // Notify listeners only if requested and callback exists
    if (notify && this.config.onSessionExpired) {
      this.config.onSessionExpired();
    }
  }

  /**
   * Get time remaining until auto-lock (in milliseconds)
   */
  getTimeRemaining(): number {
    if (!this.session || this.config.autoLockMinutes === 0) {
      return Infinity;
    }

    const timeoutMs = this.config.autoLockMinutes * 60 * 1000;
    const elapsed = Date.now() - this.session.lastActivityAt;
    return Math.max(0, timeoutMs - elapsed);
  }

  // ========================================
  // Private Methods
  // ========================================

  private startActivityMonitoring(): void {
    this.stopActivityMonitoring();

    // Set up visibility change handler
    if (typeof document !== 'undefined') {
      this.visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          // Check session validity when tab becomes visible
          if (!this.isActive()) {
            this.destroy();
          }
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    this.resetActivityTimer();
  }

  private stopActivityMonitoring(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }

    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }

  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    if (this.config.autoLockMinutes > 0) {
      const timeoutMs = this.config.autoLockMinutes * 60 * 1000;
      this.activityTimer = setTimeout(() => {
        if (!this.isActive()) {
          this.destroy();
        }
      }, timeoutMs);
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// ========================================
// React Hook
// ========================================

export function useSession() {
  const [isActive, setIsActive] = useState(sessionManager.isActive());
  const [timeRemaining, setTimeRemaining] = useState(sessionManager.getTimeRemaining());
  const [hasPassword, setHasPassword] = useState(sessionManager.hasStoredPassword());

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

  const createSession = useCallback(async (password: string) => {
    await sessionManager.createSession(password);
    setIsActive(true);
  }, []);

  const destroySession = useCallback(() => {
    sessionManager.destroy(false);
    setIsActive(false);
    setHasPassword(false);
  }, []);

  const recordActivity = useCallback(() => {
    sessionManager.recordActivity();
  }, []);

  // Wrapper that updates state after storing password
  const storePassword = useCallback(async (password: string) => {
    await sessionManager.storeEncryptedPassword(password);
    setHasPassword(true);
  }, []);

  return {
    isActive,
    timeRemaining,
    createSession,
    destroySession,
    recordActivity,
    encrypt: sessionManager.encrypt.bind(sessionManager),
    decrypt: sessionManager.decrypt.bind(sessionManager),
    storeEncryptedPassword: storePassword,
    getDecryptedPassword: sessionManager.getDecryptedPassword.bind(sessionManager),
    // Return the reactive state value, not the function
    hasStoredPassword: useCallback(() => hasPassword, [hasPassword]),
  };
}

// ========================================
// Convenience Functions
// ========================================

/**
 * Check if there's an active session
 */
export function hasActiveSession(): boolean {
  return sessionManager.isActive();
}

/**
 * Create a new session with password
 */
export async function createSession(password: string): Promise<void> {
  return sessionManager.createSession(password);
}

/**
 * Destroy the current session
 * @param notify - Whether to notify listeners (default: false for manual calls)
 */
export function destroySession(notify: boolean = false): void {
  sessionManager.destroy(notify);
}

/**
 * Store encrypted password in session for later use
 */
export async function storeEncryptedPassword(password: string): Promise<void> {
  await sessionManager.storeEncryptedPassword(password);
}

/**
 * Get decrypted password from session
 */
export async function getDecryptedPassword(): Promise<string | null> {
  return sessionManager.getDecryptedPassword();
}

/**
 * Check if session has stored password
 */
export function hasStoredPassword(): boolean {
  return sessionManager.hasStoredPassword();
}
