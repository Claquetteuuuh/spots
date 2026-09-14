"use client";

interface UploadProgressProps {
  /** How much of the upload has gone out, 0 → 1. */
  value: number;
  label: string;
  size?: number;
}

/**
 * A dot that fills as the photos go up — the app's recurring circle, used
 * here for a quantity rather than a place. Shown with the share of the
 * body already sent, which is what a photographer is waiting on.
 */
export function UploadProgress({ value, label, size = 36 }: UploadProgressProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <div
        className="relative overflow-hidden rounded-full border-2 border-accent bg-accent-tint"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        {/* The fill rises from the bottom, like a glass */}
        <div
          className="absolute inset-x-0 bottom-0 bg-accent transition-[height] duration-200 ease-out"
          style={{ height: `${percent}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-text mix-blend-luminosity">
          {percent}
        </span>
      </div>
      <span className="text-sm text-text-tertiary">{label}</span>
    </div>
  );
}
