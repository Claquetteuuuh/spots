import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = "", ...props }, ref) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-sm border px-3 py-2 text-sm
            text-text bg-bg
            placeholder:text-text-tertiary
            focus:outline-none focus:ring-1 focus:bg-bg-secondary
            transition-colors duration-150
            ${
              error
                ? "border-error focus:ring-error"
                : "border-border focus:ring-accent focus:border-accent"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error ? (
          <p className="text-xs text-error">{error}</p>
        ) : hint ? (
          <p className="text-xs text-text-tertiary">{hint}</p>
        ) : null}
      </div>
    );
  },
);
