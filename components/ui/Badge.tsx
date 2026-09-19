import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "forest" | "ochre" | "neutral" | "parchment";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    forest: "bg-[#c4e8d8]/60 text-[#234338] border-[#234338]/25",
    ochre: "bg-[#ffdbc9]/60 text-[#ba5d1a] border-[#ba5d1a]/25",
    neutral: "bg-[#f2edeb] text-[#5e5a54] border-[#e5e2d9]",
    parchment: "bg-[#f4f2eb] text-[#171615] border-[#ddd8cc]",
  }[variant];

  const dotStyles = {
    forest: "bg-[#234338]",
    ochre: "bg-[#ba5d1a]",
    neutral: "bg-[#78746d]",
    parchment: "bg-[#5e5a54]",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[0.125rem] border font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] select-none ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles}`} />}
      {children}
    </span>
  );
}
