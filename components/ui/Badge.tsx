import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "live" | "neutral" | "subtle" | "outline" | "forest" | "ochre" | "parchment";
  dot?: boolean;
}

/**
 * Badge component conforming to DESIGN.md monochrome spec.
 * --accent-live is reserved strictly for live/active states (variant="live").
 */
export function Badge({
  children,
  variant = "neutral",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  const isLive = variant === "live";

  const variantStyles = {
    live: "bg-[var(--accent-live-wash)] text-[var(--text-primary)] border-[rgba(229,72,77,0.3)]",
    neutral: "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-hairline)]",
    subtle: "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-hairline)]",
    outline: "bg-transparent text-[var(--text-secondary)] border-[var(--border-hairline)]",
    // Legacy compatibility aliases mapped strictly to monochrome tokens:
    forest: "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-hairline)]",
    ochre: "bg-[var(--bg-inset)] text-[var(--text-primary)] border-[var(--border-hover)]",
    parchment: "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-hairline)]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-button)] border font-mono text-[0.6875rem] uppercase tracking-[0.02em] select-none ${variantStyles} ${className}`}
      {...props}
    >
      {(dot || isLive) && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLive
              ? "bg-[var(--accent-live)] animate-live-breathe"
              : "bg-[var(--text-secondary)]"
          }`}
        />
      )}
      {children}
    </span>
  );
}
