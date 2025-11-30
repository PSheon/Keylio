"use client";

import { useEffect } from "react";
import { sessionManager } from "@/lib/session";
import { useSettingsStore } from "@/stores/useSettingsStore";

/**
 * Initializes session manager with user settings on app mount.
 * This ensures auto-lock settings are applied from persisted state.
 */
export function SessionInitializer() {
  const autoLockMinutes = useSettingsStore((state) => state.autoLockMinutes);

  useEffect(() => {
    sessionManager.configure({ autoLockMinutes });
  }, [autoLockMinutes]);

  return null;
}
