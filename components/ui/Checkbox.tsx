"use client";

import React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onChange, label, sublabel, className = "", disabled, ...props }, ref) => {
    return (
      <label
        className={`inline-flex items-start gap-2.5 cursor-pointer select-none group ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
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
            className={`w-4 h-4 rounded-[2px] border-[1.5px] transition-all duration-150 flex items-center justify-center ${
              checked
                ? "bg-[#234338] border-[#234338] text-[#faf9f6]"
                : "bg-[#ffffff] border-[#78746d] group-hover:border-[#234338]"
            }`}
          >
            {checked && <Check className="w-3 h-3 stroke-[2.5]" />}
          </div>
        </div>
        {(label || sublabel) && (
          <div className="flex flex-col text-sm">
            {label && (
              <span className="font-sans text-[#171615] group-hover:text-[#234338] transition-colors leading-tight">
                {label}
              </span>
            )}
            {sublabel && (
              <span className="font-sans text-xs text-[#78746d] mt-0.5 leading-tight">
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
