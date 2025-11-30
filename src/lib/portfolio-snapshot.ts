/**
 * Portfolio Snapshot Service
 *
 * Records daily portfolio values for historical chart display
 * - Saves one snapshot per wallet per day
 * - Provides data for 7/30/90 day trend charts
 */

import db from '@/lib/storage/db';
import type { PortfolioSnapshot } from '@/lib/storage/db';

// ========================================
// Helper Functions
// ========================================

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get date string for N days ago
 */
function getDateStringDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// ========================================
// Core Functions
// ========================================

/**
 * Save a portfolio snapshot for today
 * Only saves if no snapshot exists for today (one per day)
 */
export async function savePortfolioSnapshot(
  subWalletId: number,
  totalValueUSD: number
): Promise<boolean> {
  const today = getTodayDateString();

  try {
    // Check if snapshot already exists for today
    const existing = await db.portfolio_snapshots
      .where('[subWalletId+date]')
      .equals([subWalletId, today])
      .first();

    if (existing) {
      // Update existing snapshot if value changed significantly (>1%)
      const valueDiff = Math.abs(existing.totalValueUSD - totalValueUSD);
      const percentDiff = existing.totalValueUSD > 0
        ? (valueDiff / existing.totalValueUSD) * 100
        : (totalValueUSD > 0 ? 100 : 0);

      if (percentDiff >= 1) {
        await db.portfolio_snapshots.update(existing.id!, {
          totalValueUSD,
          createdAt: Date.now(),
        });
        return true;
      }
      return false; // No significant change
    }

    // Save new snapshot
    await db.portfolio_snapshots.add({
      subWalletId,
      totalValueUSD,
      date: today,
      createdAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error('[PortfolioSnapshot] Failed to save snapshot:', error);
    return false;
  }
}

/**
 * Get portfolio snapshots for chart display
 */
export async function getPortfolioSnapshots(
  subWalletId: number,
  days: number
): Promise<PortfolioSnapshot[]> {
  const startDate = getDateStringDaysAgo(days);

  try {
    const snapshots = await db.portfolio_snapshots
      .where('subWalletId')
      .equals(subWalletId)
      .and(s => s.date >= startDate)
      .sortBy('date');

    return snapshots;
  } catch (error) {
    console.error('[PortfolioSnapshot] Failed to get snapshots:', error);
    return [];
  }
}

/**
 * Generate chart data from snapshots
 * Fills in missing days with interpolated or previous values
 */
export interface ChartDataPoint {
  date: string;
  value: number;
  displayDate: string;
}

export function generateChartData(
  snapshots: PortfolioSnapshot[],
  days: number,
  currentValue: number
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = new Date();
  const today = getTodayDateString();

  // Create a map for quick lookup
  const snapshotMap = new Map<string, number>();
  for (const snap of snapshots) {
    snapshotMap.set(snap.date, snap.totalValueUSD);
  }

  // Always ensure today's value is current
  snapshotMap.set(today, currentValue);

  // Generate data points for each day
  let lastKnownValue = 0;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Get value from snapshot or use last known value
    const value = snapshotMap.get(dateStr) ?? lastKnownValue;
    lastKnownValue = value;

    data.push({
      date: dateStr,
      value,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
    });
  }

  return data;
}

/**
 * Calculate percentage change from historical data
 */
export function calculateChange(
  data: ChartDataPoint[]
): { changePercent: number; changeAmount: number; isPositive: boolean } {
  if (data.length < 2) {
    return { changePercent: 0, changeAmount: 0, isPositive: true };
  }

  // Find first non-zero value for comparison
  let firstValue = 0;
  for (const point of data) {
    if (point.value > 0) {
      firstValue = point.value;
      break;
    }
  }

  const lastValue = data[data.length - 1].value;

  if (firstValue === 0) {
    // If starting from 0, show 100% gain if we have value now
    return {
      changePercent: lastValue > 0 ? 100 : 0,
      changeAmount: lastValue,
      isPositive: true,
    };
  }

  const changeAmount = lastValue - firstValue;
  const changePercent = (changeAmount / firstValue) * 100;

  return {
    changePercent: Math.abs(changePercent),
    changeAmount,
    isPositive: changePercent >= 0,
  };
}

/**
 * Clean up old snapshots (keep last 365 days)
 */
export async function cleanupOldSnapshots(): Promise<number> {
  const cutoffDate = getDateStringDaysAgo(365);

  try {
    const oldSnapshots = await db.portfolio_snapshots
      .filter(s => s.date < cutoffDate)
      .toArray();

    const ids = oldSnapshots.map(s => s.id!).filter(Boolean);
    await db.portfolio_snapshots.bulkDelete(ids);

    return ids.length;
  } catch (error) {
    console.error('[PortfolioSnapshot] Failed to cleanup:', error);
    return 0;
  }
}
