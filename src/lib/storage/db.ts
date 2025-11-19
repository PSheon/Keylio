import Dexie, { type EntityTable } from "dexie";

// Settings stored as key-value pairs
export interface Setting {
  id?: number;
  key: string;
  value: any; // Supports primitives and JSON-serialized objects
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

const db = new Dexie("KeylioWallet") as Dexie & {
  settings: EntityTable<Setting, "id">;
  sub_wallets: EntityTable<SubWallet, "id">;
  transactions: EntityTable<Transaction, "id">;
  contacts: EntityTable<Contact, "id">;
};

// Schema definition
db.version(2).stores({
  settings: "++id, &key",
  sub_wallets: "++id, address, index",
  transactions: "++id, hash, from, to, timestamp, token, label",
  contacts: "++id, &address, name, lastUsed",
});

export default db;
export type { EntityTable };
