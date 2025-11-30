"use client";

/**
 * usePortfolioHistory Hook
 *
 * Fetches and manages portfolio history data for charts.
 * Automatically saves snapshots when portfolio value changes.
 *
 * @module hooks/usePortfolioHistory
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  savePortfolioSnapshot,
  generateChartData,
  calculateChange,
  type ChartDataPoint,
} from '@/lib/portfolio-snapshot';
import db from '@/lib/storage/db';

interface UsePortfolioHistoryOptions {
  /** Sub wallet ID */
  subWalletId: number | undefined;
  /** Current total value in USD */
  currentValueUSD: number;
  /** Number of days for history (7, 30, 90) */
  days: number;
}

interface UsePortfolioHistoryReturn {
  /** Chart data points */
  chartData: ChartDataPoint[];
  /** Percentage change over the period */
  changePercent: number;
  /** Absolute change amount */
  changeAmount: number;
  /** Is the change positive */
  isPositive: boolean;
  /** Has historical data */
  hasHistory: boolean;
  /** Is loading */
  isLoading: boolean;
}

/**
 * Hook for portfolio history and chart data
 */
export function usePortfolioHistory({
  subWalletId,
  currentValueUSD,
  days,
}: UsePortfolioHistoryOptions): UsePortfolioHistoryReturn {

  // Calculate date range for query
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }, [days]);

  // Live query for snapshots
  const snapshots = useLiveQuery(
    async () => {
      if (!subWalletId) return [];

      return db.portfolio_snapshots
        .where('subWalletId')
        .equals(subWalletId)
        .and(s => s.date >= startDate)
        .sortBy('date');
    },
    [subWalletId, startDate],
    []
  );

  // Save snapshot when value changes
  const saveSnapshot = useCallback(async () => {
    if (!subWalletId || currentValueUSD < 0) return;

    await savePortfolioSnapshot(subWalletId, currentValueUSD);
  }, [subWalletId, currentValueUSD]);

  // Save snapshot on mount and when value changes significantly
  useEffect(() => {
    if (subWalletId && currentValueUSD >= 0) {
      saveSnapshot();
    }
  }, [subWalletId, currentValueUSD, saveSnapshot]);

  // Generate chart data
  const chartData = useMemo(() => {
    return generateChartData(snapshots || [], days, currentValueUSD);
  }, [snapshots, days, currentValueUSD]);

  // Calculate change metrics
  const { changePercent, changeAmount, isPositive } = useMemo(() => {
    return calculateChange(chartData);
  }, [chartData]);

  // Check if we have real historical data (not just filled-in zeros)
  const hasHistory = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return false;

    // Check if we have at least one non-zero snapshot that isn't today
    const today = new Date().toISOString().split('T')[0];
    return snapshots.some(s => s.date !== today && s.totalValueUSD > 0);
  }, [snapshots]);

  return {
    chartData,
    changePercent,
    changeAmount,
    isPositive,
    hasHistory,
    isLoading: snapshots === undefined,
  };
}

export default usePortfolioHistory;
