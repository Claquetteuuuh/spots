"use client";

import { useCallback } from "react";
import { useLocale } from "./locale-context";
import { t } from "./i18n";

/**
 * Hook that returns a `t()` function bound to the current locale.
 * Re-renders the component when the locale changes.
 *
 * @example
 * const t = useT();
 * return <h1>{t("auth.login")}</h1>;
 */
export function useT() {
  const { locale } = useLocale();

  return useCallback(
    (key: string, params?: Record<string, string | number>) =>
      t(key, params, locale),
    [locale],
  );
}
