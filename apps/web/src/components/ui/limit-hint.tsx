"use client";

import { useT } from "@/lib/use-t";

/**
 * Limits are only worth mentioning when you are about to hit one.
 *
 * A permanent "0/2000" under every field is noise: it counts something nobody
 * is counting, and it makes an empty form look like a test. These components
 * stay silent until the limit is actually in play, then say how much room is
 * left — and say plainly when there is none.
 */

/** Characters left, once the field is within a tenth of its limit. */
export function CharacterCount({ value, max }: { value: string; max: number }) {
  const t = useT();
  const remaining = max - value.length;

  if (remaining > Math.ceil(max * 0.1)) return null;

  return (
    <p
      className={`text-sm ${remaining === 0 ? "text-error" : "text-text-tertiary"}`}
      aria-live="polite"
    >
      {remaining === 0
        ? t("common.limitReached")
        : t("common.charactersLeft", { count: remaining })}
    </p>
  );
}

/** How many more things can be picked, once you are within two of the cap. */
export function SelectionCount({
  count,
  max,
  className = "",
}: {
  count: number;
  max: number;
  className?: string;
}) {
  const t = useT();
  const remaining = max - count;

  if (remaining > 2) return null;

  return (
    <p
      className={`text-sm ${remaining === 0 ? "text-error" : "text-text-tertiary"} ${className}`}
      aria-live="polite"
    >
      {remaining === 0
        ? t("common.limitReached")
        : t("common.selectionsLeft", { count: remaining })}
    </p>
  );
}
