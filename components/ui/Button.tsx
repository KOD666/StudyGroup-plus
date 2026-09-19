"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "editorial" | "forest";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      isLoading = false,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "text-xs px-2.5 py-1 gap-1.5 h-8 font-medium",
      md: "text-sm px-4 py-2 gap-2 h-10 font-medium",
      lg: "text-base px-6 py-2.5 gap-2.5 h-12 font-medium",
    }[size];

    const variantClasses = {
      primary:
        "bg-[#ba5d1a] hover:bg-[#a24e14] text-[#faf9f6] border border-transparent shadow-none active:scale-[0.99] transition-all duration-150 rounded-[0.25rem]",
      secondary:
        "bg-transparent hover:bg-[#ffffff] text-[#171615] border border-[#ddd8cc] hover:border-[#78746d] active:scale-[0.99] transition-all duration-150 rounded-[0.25rem]",
      ghost:
        "bg-[#f6f4ed] hover:bg-[#ffffff] text-[#171615] border border-[#ddd8cc] hover:border-[#78746d] active:scale-[0.99] transition-all duration-150 rounded-[0.25rem]",
      forest:
        "bg-[#234338] hover:bg-[#193129] text-[#faf9f6] border border-transparent shadow-none active:scale-[0.99] transition-all duration-150 rounded-[0.25rem]",
      editorial:
        "bg-transparent text-[#171615] hover:text-[#ba5d1a] border-0 p-0 h-auto font-editorial italic relative group transition-colors duration-150",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center cursor-pointer select-none font-sans disabled:opacity-50 disabled:cursor-not-allowed ${
          variant === "editorial" ? "" : sizeClasses
        } ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {icon && iconPosition === "left" && <span className="inline-flex shrink-0">{icon}</span>}
            <span className="relative">
              {children}
              {variant === "editorial" && (
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#ba5d1a] transition-all duration-200 group-hover:w-full" />
              )}
            </span>
            {icon && iconPosition === "right" && <span className="inline-flex shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
