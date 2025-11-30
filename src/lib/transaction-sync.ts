/**
 * Keylio Wallet - Transaction Sync Service
 *
 * Syncs on-chain transaction history to local IndexedDB
 * Supports both native token and ERC-20 transfers
 */

import { ethers } from 'ethers';
import { ACTIVE_CHAIN, ACTIVE_CHAIN_NAME } from './chain';
import { logError } from './errors';
import db, { type Transaction } from './storage/db';
import { TOKENS } from './tokens';

// ========================================
// Types
// ========================================

interface AlchemyTransfer {
  blockNum: string;
  hash: string;
  from: string;
  to: string;
  value: number | null;
  asset: string;
  category: 'external' | 'internal' | 'erc20' | 'erc721' | 'erc1155' | 'specialnft';
  rawContract: {
    value: string | null;
    address: string | null;
    decimal: string | null;
  };
  metadata: {
    blockTimestamp: string;
  };
}

interface AlchemyResponse {
  jsonrpc: string;
  id: number;
  result: {
    transfers: AlchemyTransfer[];
    pageKey?: string;
  };
}

// ========================================
// Constants
// ========================================

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const SYNC_INTERVAL_MS = 60 * 1000; // 60 seconds
const MAX_TRANSFERS_PER_REQUEST = 100;

// Alchemy network mapping
const ALCHEMY_NETWORK_MAP: Record<string, string> = {
  'eth-mainnet': 'eth-mainnet',
  'eth-sepolia': 'eth-sepolia',
  'polygon-mainnet': 'polygon-mainnet',
  'polygon-amoy': 'polygon-amoy',
};

// ========================================
// Sync State
// ========================================

let syncIntervalId: NodeJS.Timeout | null = null;
let isSyncing = false;
let lastSyncTimestamp: number | null = null;

// ========================================
// Alchemy API Helpers
// ========================================

/**
 * Get Alchemy API URL for the active chain
 */
function getAlchemyApiUrl(): string | null {
  if (!ALCHEMY_API_KEY) {
    console.warn('[TransactionSync] Alchemy API key not configured');
    return null;
  }

  const network = ALCHEMY_NETWORK_MAP[ACTIVE_CHAIN_NAME];
  if (!network) {
    console.warn(`[TransactionSync] Chain ${ACTIVE_CHAIN_NAME} not supported by Alchemy`);
    return null;
  }

  return `https://${network}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
}

/**
 * Fetch asset transfers from Alchemy
 */
async function fetchAssetTransfers(
  address: string,
  direction: 'from' | 'to',
  pageKey?: string
): Promise<{ transfers: AlchemyTransfer[]; nextPageKey?: string }> {
  const apiUrl = getAlchemyApiUrl();
  if (!apiUrl) {
    return { transfers: [] };
  }

  const params: Record<string, unknown> = {
    category: ['external', 'erc20'],
    withMetadata: true,
    maxCount: `0x${MAX_TRANSFERS_PER_REQUEST.toString(16)}`,
    order: 'desc',
  };

  if (direction === 'from') {
    params.fromAddress = address;
  } else {
    params.toAddress = address;
  }

  if (pageKey) {
    params.pageKey = pageKey;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [params],
      }),
    });

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data: AlchemyResponse = await response.json();

    return {
      transfers: data.result?.transfers || [],
      nextPageKey: data.result?.pageKey,
    };
  } catch (error) {
    logError(error, { operation: 'fetchAssetTransfers', address, direction });
    return { transfers: [] };
  }
}

// ========================================
// Transaction Processing
// ========================================

/**
 * Convert Alchemy transfer to local Transaction format
 */
function convertToTransaction(
  transfer: AlchemyTransfer,
  walletAddress: string,
  subWalletId: number
): Omit<Transaction, 'id'> {
  const isIncoming = transfer.to.toLowerCase() === walletAddress.toLowerCase();

  // Determine token symbol
  let tokenSymbol = ACTIVE_CHAIN.symbol; // Default to native token

  if (transfer.category === 'erc20' && transfer.rawContract.address) {
    // Try to match with known tokens
    const contractAddress = transfer.rawContract.address.toLowerCase();
    const matchedToken = Object.values(TOKENS).find(
      t => t.address.toLowerCase() === contractAddress
    );
    tokenSymbol = matchedToken?.symbol || transfer.asset || 'UNKNOWN';
  }

  // Parse amount
  let amount = '0';
  if (transfer.value !== null) {
    amount = transfer.value.toString();
  } else if (transfer.rawContract.value) {
    const decimals = transfer.rawContract.decimal
      ? parseInt(transfer.rawContract.decimal, 16)
      : 18;
    amount = ethers.formatUnits(transfer.rawContract.value, decimals);
  }

  // Parse timestamp
  const timestamp = transfer.metadata?.blockTimestamp
    ? new Date(transfer.metadata.blockTimestamp).getTime()
    : Date.now();

  return {
    hash: transfer.hash,
    from: transfer.from,
    to: transfer.to,
    amount,
    token: tokenSymbol,
    status: 'confirmed', // Alchemy only returns confirmed transactions
    timestamp,
    subWalletId,
    note: isIncoming ? '鏈上同步' : undefined,
  };
}

/**
 * Check if transaction already exists in DB
 */
async function transactionExists(hash: string): Promise<boolean> {
  const existing = await db.transactions.where('hash').equals(hash).first();
  return !!existing;
}

/**
 * Save new transactions to DB
 */
async function saveTransactions(transactions: Omit<Transaction, 'id'>[]): Promise<number> {
  let savedCount = 0;

  for (const tx of transactions) {
    try {
      const exists = await transactionExists(tx.hash);
      if (!exists) {
        await db.transactions.add(tx as Transaction);
        savedCount++;
      }
    } catch (error) {
      // Ignore duplicate key errors
      if (!(error instanceof Error && error.message.includes('already exists'))) {
        logError(error, { operation: 'saveTransaction', hash: tx.hash });
      }
    }
  }

  return savedCount;
}

// ========================================
// Main Sync Functions
// ========================================

/**
 * Sync transaction history for a single wallet
 */
export async function syncWalletTransactions(
  walletAddress: string,
  subWalletId: number
): Promise<{ incoming: number; outgoing: number }> {
  if (!walletAddress) {
    return { incoming: 0, outgoing: 0 };
  }

  const normalizedAddress = walletAddress.toLowerCase();
  const result = { incoming: 0, outgoing: 0 };

  try {
    // Fetch incoming transfers (to this wallet)
    const incomingResult = await fetchAssetTransfers(normalizedAddress, 'to');
    const incomingTxs = incomingResult.transfers.map(t =>
      convertToTransaction(t, normalizedAddress, subWalletId)
    );
    result.incoming = await saveTransactions(incomingTxs);

    // Fetch outgoing transfers (from this wallet)
    const outgoingResult = await fetchAssetTransfers(normalizedAddress, 'from');
    const outgoingTxs = outgoingResult.transfers.map(t =>
      convertToTransaction(t, normalizedAddress, subWalletId)
    );
    result.outgoing = await saveTransactions(outgoingTxs);

    // Debug logging in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `[TransactionSync] Synced wallet ${walletAddress.slice(0, 8)}...: ` +
        `+${result.incoming} incoming, +${result.outgoing} outgoing`
      );
    }
  } catch (error) {
    logError(error, { operation: 'syncWalletTransactions', walletAddress });
  }

  return result;
}

/**
 * Sync transactions for all wallets in the database
 */
export async function syncAllWallets(): Promise<{ total: number; wallets: number }> {
  if (isSyncing) {
    return { total: 0, wallets: 0 };
  }

  isSyncing = true;

  try {
    const wallets = await db.sub_wallets.toArray();

    if (wallets.length === 0) {
      return { total: 0, wallets: 0 };
    }

    let totalNewTxs = 0;

    for (const wallet of wallets) {
      if (wallet.id && wallet.address) {
        const result = await syncWalletTransactions(wallet.address, wallet.id);
        totalNewTxs += result.incoming + result.outgoing;
      }
    }

    lastSyncTimestamp = Date.now();

    return { total: totalNewTxs, wallets: wallets.length };
  } catch (error) {
    logError(error, { operation: 'syncAllWallets' });
    return { total: 0, wallets: 0 };
  } finally {
    isSyncing = false;
  }
}

// ========================================
// Auto-Sync Management
// ========================================

/**
 * Start automatic transaction sync polling
 */
export function startTransactionSync(): void {
  if (syncIntervalId) {
    return;
  }

  // Initial sync
  syncAllWallets();

  // Set up interval
  syncIntervalId = setInterval(() => {
    syncAllWallets();
  }, SYNC_INTERVAL_MS);
}

/**
 * Stop automatic transaction sync polling
 */
export function stopTransactionSync(): void {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

/**
 * Check if auto-sync is running
 */
export function isTransactionSyncRunning(): boolean {
  return syncIntervalId !== null;
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTimestamp(): number | null {
  return lastSyncTimestamp;
}

/**
 * Check if currently syncing
 */
export function isSyncInProgress(): boolean {
  return isSyncing;
}

// ========================================
// React Hook Support
// ========================================

/**
 * Manual sync trigger (for pull-to-refresh)
 */
export async function manualSync(): Promise<{ total: number; wallets: number }> {
  return syncAllWallets();
}
