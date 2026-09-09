import { SUPPORTED_LOCALES, type Locale } from "@trs/shared/i18n";

export type { Locale };
export { SUPPORTED_LOCALES };

/** Cookie/localStorage key holding the user's language preference. */
export const LOCALE_STORAGE_KEY = "trs_locale";

/** One year, in seconds — the locale cookie lifetime. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Fallback used when neither a stored preference nor a usable
 * `Accept-Language` / `navigator.language` value is available.
 */
export const FALLBACK_LOCALE: Locale = "en";

/** Narrow an arbitrary value to a supported locale, or `null`. */
export function normalizeLocale(value: unknown): Locale | null {
  if (typeof value !== "string") return null;
  const code = value.split(/[-_]/)[0]?.toLowerCase();
  return (SUPPORTED_LOCALES as string[]).includes(code ?? "")
    ? (code as Locale)
    : null;
}

/**
 * Pick the best supported locale from an `Accept-Language` header,
 * honouring quality values (`fr-CA,fr;q=0.9,en;q=0.8`).
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      return { tag, quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((entry) => entry.tag && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const locale = normalizeLocale(tag);
    if (locale) return locale;
  }
  return null;
}

/** Read the locale cookie out of a raw `document.cookie` / `Cookie` string. */
export function parseLocaleCookie(cookieHeader: string | null | undefined): Locale | null {
  if (!cookieHeader) return null;
  for (const pair of cookieHeader.split(";")) {
    const [name, ...rest] = pair.trim().split("=");
    if (name === LOCALE_STORAGE_KEY) {
      return normalizeLocale(decodeURIComponent(rest.join("=")));
    }
  }
  return null;
}

/** Human-readable label for a locale, used by the language picker. */
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};
