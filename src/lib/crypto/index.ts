import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import { KeylioError, ErrorCode } from '../errors';

// ========================================
// Constants
// ========================================

/** Standard BIP44 Ethereum derivation path */
export const DERIVATION_PATH = "m/44'/60'/0'/0" as const;

// ========================================
// Mnemonic Utilities
// ========================================

/**
 * Generates a random 12-word mnemonic using BIP39.
 * Uses the browser's crypto.getRandomValues for entropy.
 */
export const generateMnemonic = (): string => {
  return bip39.generateMnemonic(128); // 128 bits of entropy = 12 words
};

/**
 * Validates a mnemonic phrase
 */
export const validateMnemonic = (mnemonic: string): boolean => {
  return bip39.validateMnemonic(mnemonic.trim().toLowerCase());
};

/**
 * Type guard to check if input is a valid mnemonic
 */
export function isValidMnemonic(input: unknown): input is string {
  if (typeof input !== 'string') return false;
  const words = input.trim().split(/\s+/);
  return words.length === 12 && validateMnemonic(input);
}

// ========================================
// HD Wallet Derivation
// ========================================

/**
 * Derives an Ethereum wallet from a mnemonic at a specific index.
 * Path: m/44'/60'/0'/0/{index}
 */
export const deriveWallet = (mnemonic: string, index: number = 0): ethers.HDNodeWallet => {
  if (!validateMnemonic(mnemonic)) {
    throw new KeylioError(ErrorCode.AUTH_INVALID_MNEMONIC);
  }
  
  try {
    // Use Mnemonic class for better compatibility
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic.trim());
    const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonicObj, `${DERIVATION_PATH}/${index}`);
    return hdNode;
  } catch (error) {
    throw new KeylioError(
      ErrorCode.WALLET_DERIVATION_FAILED,
      { index },
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Derives the Extended Public Key (xpub) from a mnemonic.
 * The xpub can be used to derive addresses without exposing private keys.
 * Safe to store (encrypted) for address derivation.
 */
export const deriveXpub = (mnemonic: string): string => {
  if (!validateMnemonic(mnemonic)) {
    throw new KeylioError(ErrorCode.AUTH_INVALID_MNEMONIC);
  }
  
  try {
    // Use Mnemonic class for better compatibility
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic.trim());
    const hdNode = ethers.HDNodeWallet.fromMnemonic(mnemonicObj, DERIVATION_PATH);
    return hdNode.neuter().extendedKey;
  } catch (error) {
    throw new KeylioError(
      ErrorCode.WALLET_DERIVATION_FAILED,
      { operation: 'deriveXpub' },
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Derives an address from an xpub at a specific index.
 * This allows generating new addresses without the mnemonic.
 */
export const deriveAddressFromXpub = (xpub: string, index: number): string => {
  try {
    const node = ethers.HDNodeWallet.fromExtendedKey(xpub);
    const childNode = node.derivePath(String(index));
    return childNode.address;
  } catch (error) {
    throw new KeylioError(
      ErrorCode.WALLET_DERIVATION_FAILED,
      { index, operation: 'deriveAddressFromXpub' },
      error instanceof Error ? error : undefined
    );
  }
};

/**
 * Derives a wallet for signing from mnemonic at a specific index.
 * Use this only when you need to sign transactions.
 */
export const deriveSigningWallet = (
  mnemonic: string,
  index: number,
  provider?: ethers.Provider
): ethers.HDNodeWallet => {
  const wallet = deriveWallet(mnemonic, index);
  return provider ? wallet.connect(provider) : wallet;
};

// --- Encryption & Decryption (AES-256-GCM) ---

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string;         // Base64 encoded
  salt: string;       // Base64 encoded
  iterations?: number; // Number of PBKDF2 iterations (Optional for backward compatibility)
}

const DEFAULT_ITERATIONS = 600000; // OWASP recommended for PBKDF2-HMAC-SHA256
const LEGACY_ITERATIONS = 100000;  // Previous default

/**
 * Encrypts text data using a password.
 * Uses PBKDF2 for key derivation and AES-GCM for encryption.
 */
export const encryptData = async (data: string, password: string): Promise<EncryptedData> => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const iterations = DEFAULT_ITERATIONS;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    enc.encode(data)
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedContent),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    iterations: iterations,
  };
};

/**
 * Decrypts data using a password.
 */
export const decryptData = async (encryptedData: EncryptedData, password: string): Promise<string> => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const salt = base64ToArrayBuffer(encryptedData.salt);
  const iv = base64ToArrayBuffer(encryptedData.iv);
  const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
  const iterations = encryptedData.iterations || LEGACY_ITERATIONS;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  try {
    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );
    return dec.decode(decryptedContent);
  } catch {
    throw new KeylioError(ErrorCode.WALLET_DECRYPTION_FAILED);
  }
};

// ========================================
// Password Storage for Passkey-based Unlock
// ========================================

/**
 * Application-level key for encrypting user password
 * This allows Passkey-verified users to access encrypted password
 * The password is double-protected: requires Passkey auth + this key
 */
const APP_PASSWORD_KEY = 'keylio-wallet-v1-passkey-unlock';

/**
 * Encrypts user password for storage (used after Passkey verification)
 * This is NOT the same as encrypting the mnemonic - this is for session recovery
 */
export const encryptPasswordForStorage = async (password: string): Promise<EncryptedData> => {
  return encryptData(password, APP_PASSWORD_KEY);
};

/**
 * Decrypts stored password (called after Passkey verification)
 */
export const decryptStoredPassword = async (encryptedData: EncryptedData): Promise<string> => {
  return decryptData(encryptedData, APP_PASSWORD_KEY);
};

// ========================================
// Helpers
// ========================================

/**
 * Convert ArrayBuffer to Base64 string (works in both browser and Node.js)
 */
function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  
  // Use Buffer in Node.js environment, or manual conversion in browser
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer (works in both browser and Node.js)
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Use Buffer in Node.js environment
  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(base64, 'base64');
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }
  
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// ========================================
// Re-exports
// ========================================

export { KeylioError, ErrorCode } from '../errors';
