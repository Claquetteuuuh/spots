import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Fields are filled rather than outlined: a tinted surface reads as "you can
 * type here" without adding a rule to every row. The border only appears on
 * focus and on error, where it is carrying information.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = "", ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`
            w-full rounded-xl border-2 px-4 py-3 text-[0.9375rem]
            text-text bg-bg-secondary
            placeholder:text-text-tertiary
            transition-colors duration-150
            focus:bg-bg focus:outline-none
            ${
              error
                ? "border-error"
                : "border-transparent focus:border-accent"
            }
            disabled:cursor-not-allowed disabled:opacity-50
            ${className}
          `}
          {...props}
        />
        {error ? (
          <p className="text-sm text-error">{error}</p>
        ) : hint ? (
          <p className="text-sm text-text-tertiary">{hint}</p>
        ) : null}
      </div>
    );
  },
);
