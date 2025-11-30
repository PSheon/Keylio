/**
 * Crypto Module Tests
 *
 * Tests for mnemonic generation and encryption/decryption.
 * HD wallet derivation tests are in hdwallet.test.ts (uses node environment)
 */

import { describe, it, expect } from 'vitest';
import {
  generateMnemonic,
  validateMnemonic,
  isValidMnemonic,
  encryptData,
  decryptData,
  DERIVATION_PATH,
} from '@/lib/crypto';

// BIP39 standard test mnemonic (from official test vectors)
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('Mnemonic Utilities', () => {
  describe('generateMnemonic', () => {
    it('should generate a 12-word mnemonic', () => {
      const mnemonic = generateMnemonic();
      const words = mnemonic.split(' ');
      expect(words).toHaveLength(12);
    });

    it('should generate unique mnemonics', () => {
      const mnemonic1 = generateMnemonic();
      const mnemonic2 = generateMnemonic();
      expect(mnemonic1).not.toBe(mnemonic2);
    });

    it('should generate valid BIP39 mnemonics', () => {
      const mnemonic = generateMnemonic();
      expect(validateMnemonic(mnemonic)).toBe(true);
    });
  });

  describe('validateMnemonic', () => {
    it('should return true for valid mnemonic', () => {
      expect(validateMnemonic(TEST_MNEMONIC)).toBe(true);
    });

    it('should return false for invalid mnemonic', () => {
      expect(validateMnemonic('invalid mnemonic phrase')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateMnemonic('')).toBe(false);
    });

    it('should handle whitespace in mnemonic', () => {
      const mnemonicWithWhitespace = `  ${TEST_MNEMONIC}  `;
      expect(validateMnemonic(mnemonicWithWhitespace)).toBe(true);
    });
  });

  describe('isValidMnemonic', () => {
    it('should be a type guard that validates mnemonic', () => {
      const validInput: unknown = TEST_MNEMONIC;
      const invalidInput: unknown = 'invalid';

      expect(isValidMnemonic(validInput)).toBe(true);
      expect(isValidMnemonic(invalidInput)).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidMnemonic(null)).toBe(false);
      expect(isValidMnemonic(undefined)).toBe(false);
      expect(isValidMnemonic(123)).toBe(false);
      expect(isValidMnemonic({})).toBe(false);
    });
  });

  describe('DERIVATION_PATH', () => {
    it('should be the standard Ethereum BIP44 path', () => {
      expect(DERIVATION_PATH).toBe("m/44'/60'/0'/0");
    });
  });
});

describe('Encryption & Decryption', () => {
  const testData = 'test secret data';
  const testPassword = 'StrongPassword123!';

  describe('encryptData', () => {
    it('should encrypt data and return expected structure', async () => {
      const encrypted = await encryptData(testData, testPassword);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('iterations');
    });

    it('should produce different ciphertext for same input (due to random IV/salt)', async () => {
      const encrypted1 = await encryptData(testData, testPassword);
      const encrypted2 = await encryptData(testData, testPassword);

      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should use OWASP recommended iterations', async () => {
      const encrypted = await encryptData(testData, testPassword);
      expect(encrypted.iterations).toBe(600000);
    });
  });

  describe('decryptData', () => {
    it('should decrypt data correctly', async () => {
      const encrypted = await encryptData(testData, testPassword);
      const decrypted = await decryptData(encrypted, testPassword);

      expect(decrypted).toBe(testData);
    });

    it('should throw error with wrong password', async () => {
      const encrypted = await encryptData(testData, testPassword);

      await expect(decryptData(encrypted, 'wrongpassword')).rejects.toThrow();
    });

    it('should handle mnemonic encryption roundtrip', async () => {
      const mnemonic = generateMnemonic();
      const encrypted = await encryptData(mnemonic, testPassword);
      const decrypted = await decryptData(encrypted, testPassword);

      expect(decrypted).toBe(mnemonic);
      expect(validateMnemonic(decrypted)).toBe(true);
    });
  });

  describe('encryption security', () => {
    it('should produce base64 encoded output', async () => {
      const encrypted = await encryptData(testData, testPassword);

      // Base64 regex pattern
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

      expect(base64Regex.test(encrypted.ciphertext)).toBe(true);
      expect(base64Regex.test(encrypted.iv)).toBe(true);
      expect(base64Regex.test(encrypted.salt)).toBe(true);
    });
  });
});
