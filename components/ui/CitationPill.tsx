import React from "react";

export interface CitationPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "footnote" | "scholarly" | "forest" | "ochre" | "dormant";
  icon?: React.ReactNode;
}

/**
 * CitationPill: Monochrome, no exceptions per Color-Elimination Gate.
 * Differentiated strictly by border contrast, typographic weight, and monospace tags.
 */
export function CitationPill({
  children,
  variant = "footnote",
  icon,
  className = "",
  ...props
}: CitationPillProps) {
  const variantClasses = {
    footnote:
      "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] font-mono text-[0.6875rem] tracking-[0.02em]",
    scholarly:
      "bg-[var(--bg-elevated)] border-[var(--border-hover)] text-[var(--text-primary)] font-mono text-[0.6875rem] font-medium tracking-[0.02em]",
    forest:
      "bg-[var(--bg-elevated)] border-[var(--border-hairline)] text-[var(--text-primary)] font-mono text-[0.6875rem] font-medium tracking-[0.02em]",
    ochre:
      "bg-[var(--bg-inset)] border-[var(--border-hover)] text-[var(--text-primary)] font-mono text-[0.6875rem] font-semibold tracking-[0.02em]",
    dormant:
      "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-disabled)] font-mono text-[0.6875rem] tracking-[0.02em]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-button)] border select-none ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
