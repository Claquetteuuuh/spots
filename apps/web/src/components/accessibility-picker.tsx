"use client";

import { SPOT_ACCESSIBILITY, type SpotAccessibility } from "@trs/shared/constants";
import { useT } from "@/lib/use-t";

interface AccessibilityPickerProps {
  value: SpotAccessibility | null;
  onChange: (value: SpotAccessibility | null) => void;
}

/**
 * One row per level, easiest first. Pressing the selected row again clears
 * it — "not rated" is a legitimate answer, so nothing is forced.
 */
export function AccessibilityPicker({ value, onChange }: AccessibilityPickerProps) {
  const t = useT();

  return (
    <div role="group" aria-label={t("spots.accessibilityTitle")} className="mt-2 flex flex-col gap-2">
      {SPOT_ACCESSIBILITY.map((level) => {
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : level)}
            className={`flex items-center gap-3 rounded-sm px-4 py-3 text-left transition-colors cursor-pointer ${
              selected
                ? "border-2 border-accent bg-accent-tint"
                : "border border-border bg-bg hover:bg-bg-secondary"
            }`}
          >
            {/* The dot stands for the selected state */}
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${selected ? "bg-accent" : "bg-border-dark"}`}
            />
            <span className="min-w-0">
              <span className={`block text-sm font-medium ${selected ? "text-accent" : "text-text"}`}>
                {t(`spots.accessibilityLevel.${level}`)}
              </span>
              <span className="block text-xs text-text-secondary">
                {t(`spots.accessibilityHint.${level}`)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
