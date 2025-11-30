"use client";

/**
 * useTransactionSync Hook
 *
 * Manages transaction sync lifecycle and provides sync status.
 * Automatically starts sync when wallet is unlocked.
 *
 * @module hooks/useTransactionSync
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  startTransactionSync,
  stopTransactionSync,
  syncAllWallets,
  getLastSyncTimestamp,
  isSyncInProgress,
} from '@/lib/transaction-sync';
import { useWalletStore } from '@/stores/useWalletStore';

interface TransactionSyncState {
  /** Whether sync is currently in progress */
  isSyncing: boolean;
  /** Last sync timestamp */
  lastSyncAt: number | null;
  /** Number of new transactions from last sync */
  lastSyncCount: number;
  /** Error message if sync failed */
  error: string | null;
}

interface UseTransactionSyncReturn extends TransactionSyncState {
  /** Manually trigger a sync */
  sync: () => Promise<void>;
  /** Format last sync time as relative string */
  lastSyncRelative: string;
}

/**
 * Hook for managing transaction sync
 *
 * Automatically starts sync when wallet is unlocked and stops when locked
 */
export function useTransactionSync(): UseTransactionSyncReturn {
  const isUnlocked = useWalletStore((state) => state.isUnlocked);
  const wallets = useWalletStore((state) => state.wallets);

  const [state, setState] = useState<TransactionSyncState>({
    isSyncing: false,
    lastSyncAt: null,
    lastSyncCount: 0,
    error: null,
  });

  // Track if we've started sync
  const hasStartedRef = useRef(false);

  // Start/stop sync based on unlock state
  useEffect(() => {
    if (isUnlocked && wallets.length > 0 && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startTransactionSync();

      // Update state from sync service
      const checkStatus = () => {
        setState(prev => ({
          ...prev,
          isSyncing: isSyncInProgress(),
          lastSyncAt: getLastSyncTimestamp(),
        }));
      };

      // Check status periodically
      const statusInterval = setInterval(checkStatus, 2000);

      return () => {
        clearInterval(statusInterval);
      };
    }

    if (!isUnlocked && hasStartedRef.current) {
      hasStartedRef.current = false;
      stopTransactionSync();
    }
  }, [isUnlocked, wallets.length]);

  // Note: We intentionally don't stop sync on unmount
  // to allow background sync to continue running

  // Manual sync function
  const sync = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      const result = await syncAllWallets();
      setState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: Date.now(),
        lastSyncCount: result.total,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : '同步失敗',
      }));
    }
  }, []);

  // Format last sync time
  const lastSyncRelative = state.lastSyncAt
    ? formatRelativeTime(state.lastSyncAt)
    : '尚未同步';

  return {
    ...state,
    sync,
    lastSyncRelative,
  };
}

/**
 * Format timestamp as relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60 * 1000) {
    return '剛剛';
  }

  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} 分鐘前`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} 小時前`;
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days} 天前`;
}

export default useTransactionSync;
