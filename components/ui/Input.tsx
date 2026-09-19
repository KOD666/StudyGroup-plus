import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#5e5a54]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-3 text-[#78746d] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-[#ffffff] text-[#171615] placeholder:text-[#78746d] border border-[#ddd8cc] rounded-[0.25rem] text-sm py-2 ${
              icon ? "pl-9 pr-3" : "px-3"
            } transition-all duration-150 outline-none focus:border-[#ba5d1a] focus:ring-1 focus:ring-[#ba5d1a] disabled:opacity-50 disabled:bg-[#f6f4ed] disabled:cursor-not-allowed ${
              error ? "border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-[#ba1a1a]" : ""
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="font-sans text-xs text-[#ba1a1a]">{error}</span>}
        {helperText && !error && (
          <span className="font-sans text-xs text-[#78746d]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
