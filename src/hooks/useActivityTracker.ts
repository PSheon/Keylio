/**
 * Keylio Wallet - Activity Tracker Hook
 * 
 * Automatically tracks user activity (mouse, keyboard, touch, scroll)
 * and extends the session timeout.
 */

import { useEffect, useCallback } from 'react';
import { sessionManager } from '@/lib/session';

interface UseActivityTrackerOptions {
  /** Whether tracking is enabled (default: true) */
  enabled?: boolean;
  /** Throttle interval in milliseconds (default: 5000) */
  throttleMs?: number;
  /** Events to track (default: all) */
  events?: ('mouse' | 'keyboard' | 'touch' | 'scroll')[];
}

/**
 * Automatically tracks user activity and extends session timeout.
 * Use this in the root layout to monitor activity across all pages.
 */
export function useActivityTracker(options: UseActivityTrackerOptions = {}) {
  const {
    enabled = true,
    throttleMs = 5000,
    events = ['mouse', 'keyboard', 'touch', 'scroll'],
  } = options;

  const recordActivity = useCallback(() => {
    sessionManager.recordActivity();
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let lastActivity = 0;
    
    const handleActivity = () => {
      const now = Date.now();
      // Throttle activity updates
      if (now - lastActivity > throttleMs) {
        lastActivity = now;
        recordActivity();
      }
    };

    const eventMap: Record<string, string[]> = {
      mouse: ['mousemove', 'mousedown', 'click'],
      keyboard: ['keydown', 'keypress'],
      touch: ['touchstart', 'touchmove'],
      scroll: ['scroll'],
    };

    const activeEvents = events.flatMap(e => eventMap[e] || []);

    // Add event listeners with passive flag for better performance
    activeEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial activity record
    recordActivity();

    return () => {
      activeEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, throttleMs, events, recordActivity]);
}
