import { NativeModules, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, fr, DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@trs/shared/i18n";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

/** Key under which the user's explicit language choice is persisted. */
const LOCALE_STORAGE_KEY = "trs_locale";

/** Human-readable label for each supported locale. */
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
};

function normalizeLocale(value: string | null | undefined): Locale | null {
  const code = value?.split(/[-_]/)[0]?.toLowerCase();
  return code && (SUPPORTED_LOCALES as string[]).includes(code)
    ? (code as Locale)
    : null;
}

/**
 * Best-effort device locale detection without pulling in expo-localization.
 * Falls back to the app default (French) when unavailable.
 */
function getDeviceLanguageCode(): string | undefined {
  try {
    const raw: string | undefined =
      Platform.OS === "ios"
        ? NativeModules.SettingsManager?.settings?.AppleLocale ??
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;

    return raw?.split(/[-_]/)[0]?.toLowerCase();
  } catch {
    return undefined;
  }
}

function resolveInitialLocale(): Locale {
  return normalizeLocale(getDeviceLanguageCode()) ?? DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
});

/** The locale currently applied, narrowed to a supported one. */
export function getAppLocale(): Locale {
  return normalizeLocale(i18n.language) ?? DEFAULT_LOCALE;
}

/** Switch language and remember the choice across app restarts. */
export async function setAppLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
  try {
    await SecureStore.setItemAsync(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage unavailable — the choice still applies for this session.
  }
}

/**
 * Re-apply the persisted language choice.
 *
 * i18next initialises synchronously with the device language; SecureStore is
 * async, so this runs once at startup to override it when the user has
 * explicitly picked a language before.
 */
export async function restoreStoredLocale(): Promise<void> {
  try {
    const stored = normalizeLocale(
      await SecureStore.getItemAsync(LOCALE_STORAGE_KEY),
    );
    if (stored && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch {
    // Storage unavailable — keep the device-derived locale.
  }
}

export default i18n;
