export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "trs_theme";

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable
  }
  return "system";
}

export function setTheme(mode: ThemeMode): void {
  try {
    if (mode === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  } catch {
    // localStorage unavailable
  }
  applyTheme(mode);
}

export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
}

/**
 * Initialize theme on page load — call once from a layout effect.
 */
export function initTheme(): void {
  applyTheme(getTheme());
}
