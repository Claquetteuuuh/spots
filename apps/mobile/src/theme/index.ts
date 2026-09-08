import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { COLORS } from "@trs/shared/constants";

/**
 * Design tokens for The Right Spot.
 *
 * Deliberately restrained: warm neutrals, a single sand/sienna accent,
 * sage green reserved for success/confirmation states, sharp corners,
 * and borders instead of shadows. Photos are the visual focus — the
 * chrome around them should stay quiet.
 */

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
  onAccent: string;

  sage: string;
  sageLight: string;
  sageDark: string;

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
  onAccent: COLORS.bg,

  sage: COLORS.sage,
  sageLight: COLORS.sageLight,
  sageDark: COLORS.sageDark,

  border: COLORS.border,
  borderDark: COLORS.borderDark,

  error: COLORS.error,
  errorLight: COLORS.errorLight,
  success: COLORS.success,
  successLight: COLORS.successLight,
  warning: COLORS.warning,
  warningLight: COLORS.warningLight,

  card: COLORS.bg,
  overlay: "rgba(26, 26, 24, 0.55)",
};

export const darkColors: ThemeColors = {
  bg: COLORS.dark.bg,
  bgSecondary: COLORS.dark.bgSecondary,
  bgTertiary: COLORS.dark.bgTertiary,

  text: COLORS.dark.text,
  textSecondary: COLORS.dark.textSecondary,
  textTertiary: COLORS.dark.textTertiary,

  accent: COLORS.accentLight,
  accentLight: COLORS.accent,
  accentDark: COLORS.accentDark,
  onAccent: COLORS.dark.bg,

  sage: COLORS.sageLight,
  sageLight: COLORS.sage,
  sageDark: COLORS.sageDark,

  border: COLORS.dark.border,
  borderDark: COLORS.dark.borderDark,

  error: COLORS.error,
  errorLight: "#2A1B18",
  success: COLORS.success,
  successLight: "#1B2418",
  warning: COLORS.warning,
  warningLight: "#2A2314",

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
// System font only — no custom display faces. Hierarchy comes from
// weight and letter-spacing, not from oversized type.

export const typography = {
  fontFamily: undefined, // undefined => platform system font (San Francisco / Roboto)
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
// Sharp corners throughout. Nothing rounder than 4px, ever.

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
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

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => buildTheme(scheme === "dark"), [scheme]);
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
