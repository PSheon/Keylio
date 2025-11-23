import Dexie from "dexie";

import type { EntityTable } from "dexie";

// Settings stored as key-value pairs
export interface Setting {
  id?: number;
  key: string;
  value: unknown; // Supports primitives and JSON-serialized objects
}

// Passkey metadata
export interface PasskeyMetadata {
  id: string; // Unique ID for this entry
  credentialId: string; // WebAuthn credential ID
  name: string; // User-friendly name (e.g., "iPhone 15 Pro")
  isDefault: boolean; // Whether this is the default Passkey
  createdAt: number; // Timestamp
  lastUsed?: number; // Last authentication timestamp
}

// Sub-wallet (derived from HD wallet)
export interface SubWallet {
  id?: number;
  name: string;
  color: string;
  emoji: string;
  address: string;
  index: number; // BIP44 index
  createdAt: number;
}

// Transaction record
export interface Transaction {
  id?: number;
  hash: string;
  from: string;
  to: string;
  amount: string;
  token: string; // Token symbol (ETH, USDT, etc.)
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  note?: string; // Transaction note
  label?: string; // Category label (Food, Transport, etc.)
  subWalletId?: number; // Reference to sub_wallets.id
}

// Contact (address book)
export interface Contact {
  id?: number;
  address: string; // Unique wallet address
  name: string;
  emoji?: string;
  notes?: string;
  lastUsed?: number;
  createdAt: number;
}

// User Preferences
export interface UserPreferences {
  id?: number;
  // Display
  language: 'en' | 'zh-TW' | 'zh-CN'; // UI language
  currency: 'USD' | 'TWD' | 'CNY' | 'EUR' | 'JPY'; // Fiat currency for display
  theme: 'light' | 'dark' | 'auto'; // Theme preference
  
  // Security
  autoLockMinutes: number; // Auto-lock timeout (0 = disabled)
  requirePasskeyForSend: boolean; // Require Passkey for every transaction
  hiddenBalances: boolean; // Hide balance amounts by default
  
  // Transactions
  defaultGasPreset: 'slow' | 'standard' | 'fast' | 'custom'; // Gas fee preference
  showTestnets: boolean; // Show testnet networks
  confirmBeforeSend: boolean; // Show confirmation dialog before sending
  
  // Privacy
  enableAnalytics: boolean; // Anonymous usage analytics
  
  // Notifications
  notifyOnReceive: boolean; // Notify when receiving tokens
  notifyOnConfirmed: boolean; // Notify when transaction confirmed
  
  updatedAt: number;
}

// Network Configuration (for multi-chain support)
export interface NetworkConfig {
  id?: number;
  chainId: number; // Blockchain chain ID
  name: string; // Network name (e.g., "Ethereum Mainnet")
  rpcUrl: string; // RPC endpoint
  symbol: string; // Native currency symbol (e.g., "ETH")
  blockExplorerUrl?: string; // Block explorer URL
  isTestnet: boolean; // Is this a testnet?
  isActive: boolean; // Is this network enabled?
  isCustom: boolean; // User-added custom network
  iconUrl?: string; // Network icon URL
  createdAt: number;
}

// Token Metadata (for custom tokens)
export interface TokenMetadata {
  id?: number;
  chainId: number; // Which network this token belongs to
  contractAddress: string; // Token contract address
  symbol: string; // Token symbol (e.g., "USDT")
  name: string; // Token full name
  decimals: number; // Token decimals
  iconUrl?: string; // Token icon URL
  isActive: boolean; // Is this token visible in wallet?
  isCustom: boolean; // User-added custom token
  balance?: string; // Cached balance (optional)
  balanceUpdatedAt?: number; // Last balance update timestamp
  createdAt: number;
}

// Transaction Categories (for spending analytics)
export interface TransactionCategory {
  id?: number;
  name: string; // Category name (e.g., "Food", "Transport")
  emoji: string; // Category icon emoji
  color: string; // Category color
  isCustom: boolean; // User-created category
  usageCount: number; // How many times used
  createdAt: number;
}

// Address Book Tag (for organizing contacts)
export interface ContactTag {
  id?: number;
  name: string; // Tag name (e.g., "Exchange", "Friend")
  color: string; // Tag color
  createdAt: number;
}

// Backup Metadata
export interface BackupMetadata {
  id?: number;
  type: 'manual' | 'cloud'; // Backup type
  provider?: 'icloud' | 'google-drive'; // Cloud provider
  lastBackupAt: number; // Last backup timestamp
  autoBackupEnabled: boolean; // Auto backup enabled
  backupHash?: string; // Hash of backup for verification
  createdAt: number;
}

const db = new Dexie("KeylioWallet") as Dexie & {
  settings: EntityTable<Setting, "id">;
  sub_wallets: EntityTable<SubWallet, "id">;
  transactions: EntityTable<Transaction, "id">;
  contacts: EntityTable<Contact, "id">;
  user_preferences: EntityTable<UserPreferences, "id">;
  networks: EntityTable<NetworkConfig, "id">;
  tokens: EntityTable<TokenMetadata, "id">;
  transaction_categories: EntityTable<TransactionCategory, "id">;
  contact_tags: EntityTable<ContactTag, "id">;
  backup_metadata: EntityTable<BackupMetadata, "id">;
};

// Schema definition
// Version 2: Original schema
db.version(2).stores({
  settings: "++id, &key",
  sub_wallets: "++id, address, index",
  transactions: "++id, hash, from, to, timestamp, token, label",
  contacts: "++id, &address, name, lastUsed",
});

// Version 3: Add professional wallet management features
db.version(3).stores({
  settings: "++id, &key",
  sub_wallets: "++id, address, index",
  transactions: "++id, hash, from, to, timestamp, token, label",
  contacts: "++id, &address, name, lastUsed",
  user_preferences: "++id",
  networks: "++id, chainId, isActive, isCustom",
  tokens: "++id, [chainId+contractAddress], symbol, isActive",
  transaction_categories: "++id, name, usageCount",
  contact_tags: "++id, name",
  backup_metadata: "++id, type, lastBackupAt",
});

// Version 4: Add subWalletId index to transactions for filtering
db.version(4).stores({
  settings: "++id, &key",
  sub_wallets: "++id, address, index",
  transactions: "++id, hash, from, to, timestamp, token, label, subWalletId",
  contacts: "++id, &address, name, lastUsed",
  user_preferences: "++id",
  networks: "++id, chainId, isActive, isCustom",
  tokens: "++id, [chainId+contractAddress], symbol, isActive",
  transaction_categories: "++id, name, usageCount",
  contact_tags: "++id, name",
  backup_metadata: "++id, type, lastBackupAt",
});

// Initialize default user preferences on first run
db.on('populate', async () => {
  await db.user_preferences.add({
    language: 'zh-TW',
    currency: 'TWD',
    theme: 'dark',
    autoLockMinutes: 15,
    requirePasskeyForSend: true,
    hiddenBalances: false,
    defaultGasPreset: 'standard',
    showTestnets: false,
    confirmBeforeSend: true,
    enableAnalytics: false,
    notifyOnReceive: true,
    notifyOnConfirmed: true,
    updatedAt: Date.now(),
  });

  // Add default Plasma network
  await db.networks.add({
    chainId: 1380012617, // Plasma chain ID (example)
    name: 'Plasma Network',
    rpcUrl: 'https://rpc.plasma.network', // Replace with actual RPC
    symbol: 'USDT',
    blockExplorerUrl: 'https://explorer.plasma.network',
    isTestnet: false,
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
  });

  // Add default transaction categories
  const defaultCategories = [
    { name: 'Food & Dining', emoji: '🍔', color: '#ef4444' },
    { name: 'Transport', emoji: '🚗', color: '#3b82f6' },
    { name: 'Shopping', emoji: '🛍️', color: '#ec4899' },
    { name: 'Entertainment', emoji: '🎬', color: '#8b5cf6' },
    { name: 'Bills & Utilities', emoji: '💡', color: '#f59e0b' },
    { name: 'Investment', emoji: '📈', color: '#10b981' },
    { name: 'Transfer', emoji: '💸', color: '#06b6d4' },
    { name: 'Other', emoji: '📌', color: '#6b7280' },
  ];

  for (const cat of defaultCategories) {
    await db.transaction_categories.add({
      ...cat,
      isCustom: false,
      usageCount: 0,
      createdAt: Date.now(),
    });
  }
});

export default db;
export type { EntityTable };
