"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Buttons are pills — the roundest thing in the interface after the wordmark's
 * dot. Only `primary` carries brand colour as a fill; `ghost` is the app's
 * inline text action and reads in brand colour too. Variants are expressed
 * purely through fill and a hairline border, never a shadow — this mirrors the
 * mobile app's Button one for one.
 */
const variantClasses: Record<Variant, string> = {
  primary:
    "border border-accent bg-accent text-on-accent hover:border-accent-dark hover:bg-accent-dark active:bg-accent-dark",
  secondary:
    "border border-border bg-bg-secondary text-text hover:bg-bg-tertiary active:bg-bg-tertiary",
  ghost: "border border-transparent bg-transparent text-accent hover:bg-bg-secondary active:bg-bg-tertiary",
  danger: "border border-error bg-error text-white hover:brightness-95 active:brightness-90",
};

/**
 * `md` and `lg` are the app's two sizes (12/24px at 15px, 16/24px at 16px).
 * `sm` is web-only, for compact desktop rows.
 */
const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-6 py-3 text-[15px]",
  lg: "px-6 py-4 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`
        relative inline-flex items-center justify-center gap-2
        rounded-full font-semibold tracking-[0.2px]
        transition-colors duration-150
        cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {/* Like the app, the spinner replaces the label — but the label keeps
          its footprint so the pill doesn't shrink under the cursor. */}
      {loading ? (
        <svg
          className="absolute h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : null}
      {loading ? <span className="invisible">{children}</span> : children}
    </button>
  );
}
