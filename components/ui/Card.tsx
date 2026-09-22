import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "ivory" | "parchment" | "elevated";
  hasHairlineRule?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "elevated",
      hasHairlineRule = false,
      interactive = true,
      className = "",
      ...props
    },
    ref
  ) => {
    const bgClass =
      variant === "parchment" ? "bg-[var(--bg-inset)]" : "bg-[var(--bg-elevated)]";

    return (
      <div
        ref={ref}
        className={`rounded-[var(--radius-card)] border border-[var(--border-hairline)] ${bgClass} text-[var(--text-primary)] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] shadow-none ${
          interactive
            ? "hover:-translate-y-1 hover:border-[var(--border-hover)]"
            : ""
        } ${
          hasHairlineRule ? "divide-y divide-[var(--border-hairline)]" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-4 border-b border-[var(--border-hairline)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-3.5 border-t border-[var(--border-hairline)] bg-[var(--bg-inset)]/60 rounded-b-[var(--radius-card)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
