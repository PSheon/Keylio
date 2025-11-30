/**
 * HD Wallet Derivation Tests
 *
 * These tests run in Node environment (not jsdom) because ethers.js
 * HDNodeWallet has compatibility issues with jsdom's crypto implementation.
 *
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import {
  deriveWallet,
  deriveXpub,
  deriveAddressFromXpub,
  DERIVATION_PATH,
} from '@/lib/crypto';

// BIP39 standard test mnemonic (from official test vectors)
const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Expected addresses from BIP44 path m/44'/60'/0'/0/x for the test mnemonic
const EXPECTED_ADDRESS_INDEX_0 = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

describe('HD Wallet Derivation', () => {
  describe('deriveWallet', () => {
    it('should derive wallet with valid address format', () => {
      const wallet = deriveWallet(TEST_MNEMONIC, 0);
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should derive correct address for test vector', () => {
      const wallet = deriveWallet(TEST_MNEMONIC, 0);
      expect(wallet.address).toBe(EXPECTED_ADDRESS_INDEX_0);
    });

    it('should derive different addresses for different indices', () => {
      const wallet0 = deriveWallet(TEST_MNEMONIC, 0);
      const wallet1 = deriveWallet(TEST_MNEMONIC, 1);

      expect(wallet0.address).not.toBe(wallet1.address);
    });

    it('should derive consistent addresses', () => {
      const wallet1 = deriveWallet(TEST_MNEMONIC, 0);
      const wallet2 = deriveWallet(TEST_MNEMONIC, 0);

      expect(wallet1.address).toBe(wallet2.address);
    });

    it('should throw error for invalid mnemonic', () => {
      expect(() => deriveWallet('invalid mnemonic', 0)).toThrow();
    });

    it('should have private key', () => {
      const wallet = deriveWallet(TEST_MNEMONIC, 0);
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('deriveXpub', () => {
    it('should derive extended public key from mnemonic', () => {
      const xpub = deriveXpub(TEST_MNEMONIC);
      expect(xpub).toBeDefined();
      expect(xpub.startsWith('xpub')).toBe(true);
    });

    it('should derive consistent xpub', () => {
      const xpub1 = deriveXpub(TEST_MNEMONIC);
      const xpub2 = deriveXpub(TEST_MNEMONIC);

      expect(xpub1).toBe(xpub2);
    });

    it('should throw error for invalid mnemonic', () => {
      expect(() => deriveXpub('invalid mnemonic')).toThrow();
    });
  });

  describe('deriveAddressFromXpub', () => {
    it('should derive same address as deriveWallet at index 0', () => {
      const xpub = deriveXpub(TEST_MNEMONIC);
      const addressFromXpub = deriveAddressFromXpub(xpub, 0);
      const wallet = deriveWallet(TEST_MNEMONIC, 0);

      expect(addressFromXpub).toBe(wallet.address);
    });

    it('should derive addresses at multiple indices', () => {
      const xpub = deriveXpub(TEST_MNEMONIC);

      for (let i = 0; i < 5; i++) {
        const addressFromXpub = deriveAddressFromXpub(xpub, i);
        const wallet = deriveWallet(TEST_MNEMONIC, i);
        expect(addressFromXpub).toBe(wallet.address);
      }
    });

    it('should throw error for invalid xpub', () => {
      expect(() => deriveAddressFromXpub('invalid-xpub', 0)).toThrow();
    });
  });

  describe('DERIVATION_PATH', () => {
    it('should be the standard Ethereum BIP44 path', () => {
      expect(DERIVATION_PATH).toBe("m/44'/60'/0'/0");
    });
  });
});
