"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "studygroup_theme";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM
  const applyTheme = useCallback((targetTheme: Theme) => {
    const resolved: ResolvedTheme =
      targetTheme === "system" ? getSystemTheme() : targetTheme;
    setResolvedTheme(resolved);

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (resolved === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        root.style.colorScheme = "dark";
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
        root.style.colorScheme = "light";
      }
    }
  }, []);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const initialTheme: Theme =
        savedTheme && ["light", "dark", "system"].includes(savedTheme)
          ? savedTheme
          : "system";

      setThemeState(initialTheme);
      applyTheme(initialTheme);
    } catch {
      applyTheme("system");
    } finally {
      setMounted(true);
    }
  }, [applyTheme]);

  // Listen for system theme changes if theme === "system"
  useEffect(() => {
    if (!mounted || theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyTheme("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted, theme, applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch {
        // Ignore storage errors (e.g. incognito restrictions)
      }
      applyTheme(newTheme);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
