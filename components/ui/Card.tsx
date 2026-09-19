import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "ivory" | "parchment" | "elevated";
  hasHairlineRule?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "ivory",
      hasHairlineRule = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const bgClasses = {
      ivory: "bg-[#ffffff]",
      parchment: "bg-[#f4f2eb]",
      elevated: "bg-[#ffffff] shadow-paper-contact",
    }[variant];

    return (
      <div
        ref={ref}
        className={`rounded-[0.25rem] border border-[#e5e2d9] transition-all duration-200 ${bgClasses} ${
          hasHairlineRule ? "divide-y divide-[#e5e2d9]" : ""
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
      className={`px-5 py-4 border-b border-[#e5e2d9] ${className}`}
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
      className={`px-5 py-3 border-t border-[#e5e2d9] bg-[#faf9f6]/60 rounded-b-[0.25rem] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
