import { en, fr } from "@trs/shared/i18n";
import {
  FALLBACK_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  parseLocaleCookie,
  type Locale,
} from "./locale";

export { en, fr };
export type { Locale };

type DeepStringRecord = { [key: string]: string | DeepStringRecord };

const DICTIONARIES: Record<Locale, DeepStringRecord> = { en, fr };

/**
 * Detect the stored locale on the client side.
 * Returns {@link FALLBACK_LOCALE} on the server (no cookie/localStorage access);
 * server components should pass an explicit locale from `getServerLocale()`.
 */
function detectLocale(): Locale {
  if (typeof window === "undefined") return FALLBACK_LOCALE;

  const fromCookie = parseLocaleCookie(document.cookie);
  if (fromCookie) return fromCookie;

  try {
    const stored = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // localStorage unavailable
  }

  if (typeof navigator !== "undefined") {
    const fromBrowser = normalizeLocale(navigator.language);
    if (fromBrowser) return fromBrowser;
  }

  return FALLBACK_LOCALE;
}

/**
 * Get a nested value from the translations object using a dot-separated key.
 * Supports `{{param}}` interpolation.
 *
 * When called without an explicit locale, detects the stored preference
 * (cookie / localStorage / browser language). Falls back to English on the
 * server. Use the `useT()` hook in client components for reactive locale
 * changes, and `getServerLocale()` + an explicit `locale` in server components.
 *
 * @example
 * t("auth.login") // "Sign in"
 * t("auth.continueWith", { provider: "Google" }) // "Continue with Google"
 * t("auth.login", undefined, "fr") // "Se connecter"
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale?: Locale,
): string {
  const resolvedLocale = locale ?? detectLocale();
  const translations = DICTIONARIES[resolvedLocale] ?? DICTIONARIES[FALLBACK_LOCALE];

  let value: string | DeepStringRecord | undefined = translations;
  for (const segment of key.split(".")) {
    if (typeof value !== "object" || value === null) return key;
    value = value[segment];
    if (value === undefined) return key;
  }

  if (typeof value !== "string") return key;

  if (!params) return value;

  return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`,
  );
}

/**
 * Build a `t()` bound to a fixed locale — the server-component counterpart of
 * the `useT()` hook.
 *
 * @example
 * const t = getTranslator(await getServerLocale());
 */
export function getTranslator(locale: Locale) {
  return (key: string, params?: Record<string, string | number>) =>
    t(key, params, locale);
}
