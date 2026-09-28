"use client";

import React from "react";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "editorial" | "forest";
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
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8 font-medium",
      md: "text-sm px-4 py-2 gap-2 h-10 font-medium",
      lg: "text-base px-6 py-2.5 gap-2.5 h-12 font-medium",
    }[size];

    // DESIGN.md §5: Primary button inverts on hover over --dur-fast --ease-out-quart. Press scales to 0.97.
    // Secondary/ghost has no fill at rest; hover adds --bg-elevated fill only.
    const variantClasses = {
      primary:
        "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-hairline)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] hover:border-transparent active:scale-[0.97] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] rounded-[var(--radius-button)]",
      secondary:
        "bg-transparent text-[var(--text-primary)] border border-[var(--border-hairline)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)] active:scale-[0.97] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] rounded-[var(--radius-button)]",
      ghost:
        "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:scale-[0.97] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] rounded-[var(--radius-button)]",
      forest:
        "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-hairline)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] active:scale-[0.97] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] rounded-[var(--radius-button)]",
      editorial:
        "bg-transparent text-[var(--text-primary)] hover:text-[var(--text-secondary)] border-0 p-0 h-auto font-mono text-xs tracking-[0.02em] relative group transition-colors duration-[var(--dur-fast)]",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        data-cursor-invert="true"
        className={`cursor-element inline-flex items-center justify-center cursor-pointer select-none font-sans disabled:opacity-40 disabled:cursor-not-allowed shadow-none ${
          variant === "editorial" ? "" : sizeClasses
        } ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          /* DESIGN.md §5: 3-dot pulse rather than a spinner */
          <span
            className="inline-flex items-center gap-1 py-1"
            aria-label="Loading"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-busy-dot-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-busy-dot-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-busy-dot-3" />
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="inline-flex shrink-0">{icon}</span>
            )}
            <span className="relative">
              {children}
              {variant === "editorial" && (
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-current transition-all duration-200 group-hover:w-full" />
              )}
            </span>
            {icon && iconPosition === "right" && (
              <span className="inline-flex shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
