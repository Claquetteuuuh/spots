import { en, fr } from "@trs/shared/i18n";

export { en, fr };

type DeepStringRecord = { [key: string]: string | DeepStringRecord };

/**
 * Get a nested value from the translations object using a dot-separated key.
 * Supports `{{param}}` interpolation.
 *
 * @example
 * t("auth.login") // "Sign in"
 * t("auth.continueWith", { provider: "Google" }) // "Continue with Google"
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: "en" | "fr" = "en",
): string {
  const translations: DeepStringRecord = locale === "fr" ? fr : en;

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
