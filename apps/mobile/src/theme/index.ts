import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { COLORS } from "@trs/shared/constants";

/**
 * Design tokens for spots.
 *
 * Blue and white, one brand hue and nothing else. Neutrals are cooled
 * toward that blue so surfaces read as daylight; green and red appear only
 * for success and failure. Corners are round, following the wordmark.
 * Photographs are the content — the chrome around them stays quiet.
 */

// ─── Theme mode ─────────────────────────────────────────────────────

export type ThemeMode = "system" | "light" | "dark";

const THEME_KEY = "trs.themeMode";

// ─── Color schemes ───────────────────────────────────────────────────

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;

  text: string;
  textSecondary: string;
  textTertiary: string;

  accent: string;
  accentLight: string;
  accentDark: string;
  accentTint: string;
  onAccent: string;

  border: string;
  borderDark: string;

  error: string;
  errorLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;

  card: string;
  overlay: string;
}

export const lightColors: ThemeColors = {
  bg: COLORS.bg,
  bgSecondary: COLORS.bgSecondary,
  bgTertiary: COLORS.bgTertiary,

  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  textTertiary: COLORS.textTertiary,

  accent: COLORS.accent,
  accentLight: COLORS.accentLight,
  accentDark: COLORS.accentDark,
  accentTint: COLORS.accentTint,
  onAccent: "#FFFFFF",

  border: COLORS.border,
  borderDark: COLORS.borderDark,

  error: COLORS.error,
  errorLight: COLORS.errorLight,
  success: COLORS.success,
  successLight: COLORS.successLight,
  warning: COLORS.warning,
  warningLight: COLORS.warningLight,

  card: COLORS.bg,
  overlay: "rgba(13, 20, 32, 0.55)",
};

export const darkColors: ThemeColors = {
  bg: COLORS.dark.bg,
  bgSecondary: COLORS.dark.bgSecondary,
  bgTertiary: COLORS.dark.bgTertiary,

  text: COLORS.dark.text,
  textSecondary: COLORS.dark.textSecondary,
  textTertiary: COLORS.dark.textTertiary,

  accent: "#6E9BE6",
  accentLight: "#9DBDF0",
  accentDark: COLORS.accent,
  accentTint: COLORS.dark.accentTint,
  onAccent: COLORS.dark.bg,

  border: COLORS.dark.border,
  borderDark: COLORS.dark.borderDark,

  error: COLORS.error,
  errorLight: "#2C1A18",
  success: COLORS.success,
  successLight: "#12261D",
  warning: COLORS.warning,
  warningLight: "#2A2214",

  card: COLORS.dark.bgSecondary,
  overlay: "rgba(0, 0, 0, 0.6)",
};

// ─── Spacing ─────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── Typography ──────────────────────────────────────────────────────
// Fredoka is the brand's voice and is reserved for the wordmark and display
// headings; everything you actually read stays on the platform system face,
// which is the most legible option on a phone.

export const typography = {
  fontFamily: undefined, // undefined => platform system font (San Francisco / Roboto)
  display: "Fredoka-SemiBold",
  size: {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// ─── Radius ──────────────────────────────────────────────────────────
// Round, following the wordmark: pills for anything pressable, generous
// radii on photography, nothing sharp.

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999, // pills, avatars
} as const;

// ─── Borders ─────────────────────────────────────────────────────────

export const borderWidth = {
  hairline: 1,
  thick: 2,
} as const;

// ─── Theme object ────────────────────────────────────────────────────

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  borderWidth: typeof borderWidth;
}

function buildTheme(dark: boolean): Theme {
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    spacing,
    typography,
    radius,
    borderWidth,
  };
}

export const lightTheme = buildTheme(false);
export const darkTheme = buildTheme(true);

// ─── Provider / hook ─────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: "system",
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    void SecureStore.getItemAsync(THEME_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    void SecureStore.setItemAsync(THEME_KEY, next);
  };

  const isDark = useMemo(() => {
    if (mode === "light") return false;
    if (mode === "dark") return true;
    return systemScheme === "dark";
  }, [mode, systemScheme]);

  const theme = useMemo(() => buildTheme(isDark), [isDark]);

  const value = useMemo(() => ({ theme, mode, setMode }), [theme, mode]);

  // Don't render children until we've loaded the stored preference,
  // otherwise there's a flash of the wrong theme.
  if (!loaded) return null;

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeMode(): { mode: ThemeMode; setMode: (mode: ThemeMode) => void } {
  const { mode, setMode } = useContext(ThemeContext);
  return { mode, setMode };
}
