/**
 * Theme utilities for cookie-based theme persistence
 * 使用 cookie 儲存主題偏好，讓 Server Component 也能讀取
 */

export type Theme = "light" | "dark" | "system";

const THEME_COOKIE_NAME = "keylio-theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * 取得目前的主題設定（Client-side）
 */
export function getThemeFromCookie(): Theme {
  if (typeof document === "undefined") return "dark";

  const match = document.cookie.match(new RegExp(`(^| )${THEME_COOKIE_NAME}=([^;]+)`));
  const theme = match?.[2] as Theme | undefined;

  return theme && ["light", "dark", "system"].includes(theme) ? theme : "dark";
}

/**
 * 設定主題到 cookie（Client-side）
 */
export function setThemeCookie(theme: Theme): void {
  if (typeof document === "undefined") return;

  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * 取得實際應套用的主題 class（處理 system 選項）
 */
export function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/**
 * 套用主題到 document
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;

  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}
