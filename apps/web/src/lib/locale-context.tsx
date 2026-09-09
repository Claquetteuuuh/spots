"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  FALLBACK_LOCALE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  parseLocaleCookie,
  type Locale,
} from "./locale";

export type { Locale };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Client-side locale detection, in the same order the server uses:
 * cookie → localStorage → browser language → fallback.
 */
function getStoredLocale(): Locale {
  if (typeof window === "undefined") return FALLBACK_LOCALE;

  const fromCookie = parseLocaleCookie(document.cookie);
  if (fromCookie) return fromCookie;

  try {
    const stored = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // localStorage unavailable (private mode, blocked cookies)
  }

  if (typeof navigator !== "undefined") {
    const fromBrowser = normalizeLocale(navigator.language);
    if (fromBrowser) return fromBrowser;
  }

  return FALLBACK_LOCALE;
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable
  }
  // The cookie is what lets server components render in the right language.
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function LocaleProvider({
  children,
  initialLocale = FALLBACK_LOCALE,
}: {
  children: ReactNode;
  /** Locale resolved on the server, so first paint matches the markup. */
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Reconcile with client-side storage after mount. This only differs from
  // `initialLocale` when no cookie was sent yet (first visit, browser default).
  useEffect(() => {
    const detected = getStoredLocale();
    if (detected !== initialLocale) {
      startTransition(() => setLocaleState(detected));
    }
    persistLocale(detected);
  }, [initialLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    persistLocale(newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

/**
 * Get the current locale outside of React components.
 * Falls back to stored value or default.
 */
export function getCurrentLocale(): Locale {
  return getStoredLocale();
}
