import { forwardRef } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldChromeProps {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Field styling shared by Input and Textarea, copied from the app's Input:
 * a quiet filled surface with a hairline border that darkens on focus and
 * turns red on error, under a small uppercase label that reddens with it.
 */
// NB: globals.css remaps the radius scale — `rounded-md` is 12px here, the
// app's Input radius; `rounded-xl` would be 24px.
const fieldClasses = (error: string | undefined, className: string) => `
  w-full rounded-md border bg-bg-secondary px-4 py-3 text-[15px] text-text
  placeholder:text-text-tertiary
  transition-colors duration-150
  focus:outline-none
  ${error ? "border-error" : "border-border focus:border-border-dark"}
  disabled:cursor-not-allowed disabled:opacity-50
  ${className}
`;

function FieldLabel({ id, label, error }: { id?: string; label: string; error?: string }) {
  return (
    <label
      htmlFor={id}
      className={`text-xs font-medium uppercase tracking-[0.5px] ${error ? "text-error" : "text-text-secondary"}`}
    >
      {label}
    </label>
  );
}

function FieldMessage({ error, hint }: { error?: string; hint?: string }) {
  if (error) return <p className="text-xs text-error">{error}</p>;
  if (hint) return <p className="text-xs text-text-tertiary">{hint}</p>;
  return null;
}

function fieldId(id: string | undefined, label: string | undefined) {
  return id ?? label?.toLowerCase().replace(/\s+/g, "-");
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldChromeProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = "", ...props }, ref) {
    const inputId = fieldId(id, label);

    return (
      <div className="flex flex-col gap-1">
        {label ? <FieldLabel id={inputId} label={label} error={error} /> : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={fieldClasses(error, className)}
          {...props}
        />
        <FieldMessage error={error} hint={hint} />
      </div>
    );
  },
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldChromeProps {}

/** The same field, taller — the app's `multiline` Input. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id, className = "", rows = 4, ...props }, ref) {
    const inputId = fieldId(id, label);

    return (
      <div className="flex flex-col gap-1">
        {label ? <FieldLabel id={inputId} label={label} error={error} /> : null}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={error ? true : undefined}
          className={fieldClasses(error, `resize-none ${className}`)}
          {...props}
        />
        <FieldMessage error={error} hint={hint} />
      </div>
    );
  },
);
