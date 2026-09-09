import { cookies, headers } from "next/headers";
import {
  FALLBACK_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  parseAcceptLanguage,
  type Locale,
} from "./locale";

/**
 * Resolve the locale for server-rendered output.
 *
 * Order of precedence:
 *  1. the `trs_locale` cookie (explicit user choice, written by LocaleProvider)
 *  2. the `Accept-Language` request header
 *  3. {@link FALLBACK_LOCALE}
 *
 * Server components must use this instead of relying on `t()`'s client-side
 * detection — `localStorage` and `navigator` do not exist during SSR, so the
 * markup would always be English otherwise.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = normalizeLocale(cookieStore.get(LOCALE_STORAGE_KEY)?.value);
  if (fromCookie) return fromCookie;

  const headerStore = await headers();
  return (
    parseAcceptLanguage(headerStore.get("accept-language")) ?? FALLBACK_LOCALE
  );
}
