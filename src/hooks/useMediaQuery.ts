"use client";

import { useSyncExternalStore, useCallback } from "react";

/**
 * Hook to check if a media query matches
 * Uses useSyncExternalStore for proper SSR support and React 18+ compatibility
 * @param query - CSS media query string (e.g., "(min-width: 640px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Use useSyncExternalStore for better React 18+ compatibility
  const subscribe = useCallback(
    (callback: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches;
  }, [query]);

  // Return false during SSR to avoid hydration mismatch
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
