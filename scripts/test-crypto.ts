import { generateMnemonic, deriveWallet, encryptData, decryptData } from '../src/lib/crypto/index';

// Polyfill for Node.js environment
if (typeof window === 'undefined') {
  (global as any).window = {
    btoa: (str: string) => Buffer.from(str, 'binary').toString('base64'),
    atob: (str: string) => Buffer.from(str, 'base64').toString('binary'),
  };
}


async function testCrypto() {
  console.log("--- Testing Crypto Module ---");

  // 1. Test Mnemonic Generation
  const mnemonic = generateMnemonic();
  console.log("Generated Mnemonic:", mnemonic);
  if (mnemonic.split(' ').length !== 12) {
    console.error("❌ Mnemonic length is not 12 words");
    process.exit(1);
  }
  console.log("✅ Mnemonic generation passed");

  // 2. Test Wallet Derivation
  const wallet = deriveWallet(mnemonic, 0);
  console.log("Derived Wallet Address:", wallet.address);
  if (!wallet.address.startsWith('0x')) {
    console.error("❌ Invalid wallet address");
    process.exit(1);
  }
  console.log("✅ Wallet derivation passed");

  // 3. Test Encryption/Decryption
  const password = "StrongPassword123!";
  const secretData = mnemonic;
  
  console.log("Encrypting data...");
  const encrypted = await encryptData(secretData, password);
  console.log("Encrypted:", encrypted);

  console.log("Decrypting data...");
  const decrypted = await decryptData(encrypted, password);
  
  if (decrypted !== secretData) {
    console.error("❌ Decryption failed: Data mismatch");
    console.error("Expected:", secretData);
    console.error("Got:", decrypted);
    process.exit(1);
  }
  console.log("✅ Encryption/Decryption passed");

  console.log("🎉 All crypto tests passed!");
}

// Polyfill for crypto in Node.js environment if needed, 
// but since we are running this via ts-node or similar, we might need to ensure global crypto is available.
// However, the implementation uses `window.crypto` or `crypto` global. 
// In Node 19+, globalThis.crypto is available.
// Let's check if we can run this with `npx tsx`.

testCrypto().catch(console.error);
