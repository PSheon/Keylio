"use client";

import { useEffect } from "react";
import { applyTheme, setThemeCookie } from "@/lib/theme";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    // Apply theme to document
    applyTheme(theme);

    // Save to cookie for SSR
    setThemeCookie(theme);

    // Listen for system theme changes when theme is 'system'
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return <>{children}</>;
}
