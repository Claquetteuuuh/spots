"use client";

import { LOCALE_LABELS, SUPPORTED_LOCALES } from "@/lib/locale";
import { useLocale } from "@/lib/locale-context";
import { useT } from "@/lib/use-t";

/**
 * Compact FR / EN switch for pages that have no settings screen behind them —
 * the landing page and the signed-out views. Inside the app the same choice
 * lives in Settings.
 */
export function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t("settings.language")}
      className={`inline-flex items-center rounded-full bg-bg-secondary p-0.5 ${className}`}
    >
      {SUPPORTED_LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            title={LOCALE_LABELS[code]}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
              active
                ? "bg-bg text-text shadow-raise"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
