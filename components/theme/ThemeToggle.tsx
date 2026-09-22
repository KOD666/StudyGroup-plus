"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function ThemeToggle({
  className = "",
  showLabel = false,
  size = "md",
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const sizeClasses = {
    sm: "p-1.5 text-xs gap-1.5",
    md: "p-2 text-xs sm:text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
  }[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        isDark
          ? "Dark mode active. Switch to light mode"
          : "Light mode active. Switch to dark mode"
      }
      className={`relative inline-flex items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors duration-[var(--dur-fast)] cursor-pointer select-none focus:outline-hidden focus:border-[var(--border-focus)] ${sizeClasses} ${className}`}
    >
      <span className="relative flex items-center justify-center">
        {mounted ? (
          isDark ? (
            <Sun
              className={`${iconSizes} text-[var(--text-primary)] transition-transform duration-[var(--dur-fast)] rotate-0 scale-100`}
            />
          ) : (
            <Moon
              className={`${iconSizes} text-[var(--text-primary)] transition-transform duration-[var(--dur-fast)] rotate-0 scale-100`}
            />
          )
        ) : (
          <span className={`${iconSizes} inline-block opacity-0`} />
        )}
      </span>

      {showLabel && (
        <span className="font-mono text-xs">
          {mounted ? (isDark ? "Light Mode" : "Dark Mode") : "Theme"}
        </span>
      )}
    </button>
  );
}
