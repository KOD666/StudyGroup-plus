import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = "", id, ...props }, ref) => {
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-xs uppercase tracking-[0.02em] text-[var(--text-secondary)] select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-3 text-[var(--text-secondary)] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[var(--bg-inset)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] rounded-[var(--radius-button)] text-sm py-2 ${
              icon ? "pl-9 pr-3" : "px-3"
            } transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] outline-none focus:border-[var(--border-hover)] focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-40 disabled:cursor-not-allowed shadow-none ${
              error ? "border-[var(--border-focus)]" : ""
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="font-mono text-xs text-[var(--text-primary)] tracking-[0.02em]">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className="font-sans text-xs text-[var(--text-secondary)]">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
