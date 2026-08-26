"use client";

import { useEffect } from "react";
import { initTheme } from "@/lib/theme";

/**
 * Invisible client component that applies the saved theme
 * preference on first render.
 */
export function ThemeInit() {
  useEffect(() => {
    initTheme();
  }, []);
  return null;
}
