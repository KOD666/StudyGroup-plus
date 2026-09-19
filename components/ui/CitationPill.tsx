import React from "react";

export interface CitationPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "footnote" | "scholarly" | "forest" | "ochre" | "dormant";
  icon?: React.ReactNode;
}

export function CitationPill({
  children,
  variant = "footnote",
  icon,
  className = "",
  ...props
}: CitationPillProps) {
  const variantClasses = {
    footnote:
      "bg-[#f4f2eb] border-[#e5e2d9] text-[#171615] font-editorial italic text-xs",
    scholarly:
      "bg-[#ffffff] border-[#ddd8cc] text-[#5e5a54] font-sans text-[0.6875rem] uppercase tracking-[0.08em] font-semibold",
    forest:
      "bg-[#c4e8d8]/50 border-[#234338]/30 text-[#234338] font-sans text-[0.6875rem] uppercase tracking-[0.08em] font-semibold",
    ochre:
      "bg-[#ffdbc9]/50 border-[#ba5d1a]/30 text-[#ba5d1a] font-sans text-[0.6875rem] uppercase tracking-[0.08em] font-semibold",
    dormant:
      "bg-[#f2edeb] border-[#e6e2df] text-[#78746d] font-sans text-[0.6875rem] uppercase tracking-[0.08em] font-semibold",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[0.25rem] border leading-relaxed select-none ${variantClasses} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
