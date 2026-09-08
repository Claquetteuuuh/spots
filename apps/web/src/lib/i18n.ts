import { en, fr } from "@trs/shared/i18n";

export { en, fr };

type Locale = "en" | "fr";

type DeepStringRecord = { [key: string]: string | DeepStringRecord };

/**
 * Detect the stored locale on the client side.
 * Returns "en" on the server (no localStorage).
 */
function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem("trs_locale");
    if (stored === "en" || stored === "fr") return stored;
  } catch {
    // localStorage unavailable
  }
  if (typeof navigator !== "undefined") {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith("fr")) return "fr";
  }
  return "en";
}

/**
 * Get a nested value from the translations object using a dot-separated key.
 * Supports `{{param}}` interpolation.
 *
 * When called without an explicit locale, detects the stored preference
 * (localStorage / browser language). Falls back to "en" on the server.
 * Use the `useT()` hook in client components for reactive locale changes.
 *
 * @example
 * t("auth.login") // "Sign in"
 * t("auth.continueWith", { provider: "Google" }) // "Continue with Google"
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale?: Locale,
): string {
  const resolvedLocale = locale ?? detectLocale();
  const translations: DeepStringRecord = resolvedLocale === "fr" ? fr : en;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations;
  for (const segment of key.split(".")) {
    value = value?.[segment];
    if (value === undefined) return key;
  }

  if (typeof value !== "string") return key;

  if (!params) return value;

  return value.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{{${name}}}`,
  );
}
