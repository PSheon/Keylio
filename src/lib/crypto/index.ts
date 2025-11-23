import { ethers } from 'ethers';
import * as bip39 from 'bip39';

// --- Mnemonic & Wallet Derivation ---

/**
 * Generates a random 12-word mnemonic using BIP39.
 * Uses the browser's crypto.getRandomValues for entropy.
 */
export const generateMnemonic = (): string => {
  return bip39.generateMnemonic(128); // 128 bits of entropy = 12 words
};

/**
 * Derives an Ethereum wallet from a mnemonic at a specific index.
 * Path: m/44'/60'/0'/0/{index}
 */
export const deriveWallet = (mnemonic: string, index: number = 0): ethers.HDNodeWallet => {
  // "m" ensures we get the master node, so we can derive the full path
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, "m");
  return wallet.derivePath(`m/44'/60'/0'/0/${index}`);
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
    throw new Error("Decryption failed. Wrong password?");
  }
};

// --- Helpers ---

function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
