"use client";

import React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
}

/**
 * Checkbox component: monochrome invert with --dur-instant transition (§5).
 * Checked state: --invert-bg fill (#ededed) with --invert-text (#0a0a0a) checkmark.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { checked, onChange, label, sublabel, className = "", disabled, ...props },
    ref
  ) => {
    return (
      <label
        className={`inline-flex items-start gap-2.5 cursor-pointer select-none group ${
          disabled ? "opacity-40 cursor-not-allowed" : ""
        } ${className}`}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <div
            className={`w-4 h-4 rounded-[3px] border transition-all duration-[var(--dur-instant)] flex items-center justify-center ${
              checked
                ? "bg-[var(--invert-bg)] border-[var(--invert-bg)] text-[var(--invert-text)]"
                : "bg-[var(--bg-inset)] border-[var(--border-hairline)] group-hover:border-[var(--border-hover)]"
            }`}
          >
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>
        {(label || sublabel) && (
          <div className="flex flex-col text-sm">
            {label && (
              <span className="font-sans text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] transition-colors duration-[var(--dur-fast)] leading-tight">
                {label}
              </span>
            )}
            {sublabel && (
              <span className="font-mono text-xs text-[var(--text-secondary)] mt-0.5 leading-tight">
                {sublabel}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
