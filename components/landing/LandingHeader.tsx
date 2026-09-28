"use client";

import React from "react";
import Link from "next/link";
import { Search, Bell, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { StudyGroupLogo } from "@/components/icons/StudyGroupLogo";

export function LandingHeader() {
  const { isSignedIn } = useAuth();

  return (
    <header className="w-full sticky top-0 z-50 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-hairline)]">

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Term Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <StudyGroupLogo size={24} className="text-[var(--text-primary)] group-hover:opacity-80 transition-opacity" />
            <span className="font-serif text-2xl font-normal tracking-tight text-[var(--text-primary)] group-hover:opacity-80 transition-opacity">
              StudyGroup<span className="font-normal opacity-60">+</span>
            </span>
          </Link>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-[4px] border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[0.625rem] font-mono uppercase tracking-widest text-[var(--text-secondary)]">
            Study Workspace
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-sans text-[var(--text-secondary)]">
          <a
            href="#features"
            className="hover:text-[var(--text-primary)] transition-colors py-1"
          >
            Features
          </a>
          <a
            href="#workspace"
            className="hover:text-[var(--text-primary)] transition-colors py-1"
          >
            Workspace
          </a>
          <a
            href="#about"
            className="hover:text-[var(--text-primary)] transition-colors py-1"
          >
            About
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search study materials"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[6px] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[6px] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle size="sm" />

          {isSignedIn ? (
            <Link href="/lounges">
              <Button
                variant="primary"
                size="sm"
                icon={<BookOpen className="w-3.5 h-3.5" />}
              >
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in" className="hidden sm:inline-block">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
