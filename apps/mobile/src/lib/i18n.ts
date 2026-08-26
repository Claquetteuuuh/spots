import { NativeModules, Platform } from "react-native";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en, fr, DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@trs/shared/i18n";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

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
  const code = getDeviceLanguageCode();
  if (code && (SUPPORTED_LOCALES as string[]).includes(code)) {
    return code as Locale;
  }
  return DEFAULT_LOCALE;
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

export async function setAppLocale(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export default i18n;
