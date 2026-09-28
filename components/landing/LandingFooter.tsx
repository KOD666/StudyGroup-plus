"use client";

import React from "react";
import Link from "next/link";
import { StudyGroupLogo } from "@/components/icons/StudyGroupLogo";

export function LandingFooter() {
  return (
    <footer className="bg-[var(--bg-inset)] text-[var(--text-secondary)] border-t border-[var(--border-hairline)] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[var(--border-hairline)]">
          {/* Brand Atelier Column */}
          <div className="lg:col-span-6 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2 font-serif text-2xl font-normal tracking-tight text-[var(--text-primary)] hover:opacity-80 transition-opacity">
              <StudyGroupLogo size={24} className="text-[var(--text-primary)]" />
              <span>StudyGroup<span className="font-normal opacity-60">+</span></span>
            </Link>
            <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              A collaborative study workspace where video meetings live directly inside your shared
              reading documents, notes, and group archives.
            </p>
          </div>

          {/* Navigation Column (capped at 2 real links) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--text-primary)]">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/lounges" className="hover:text-[var(--text-primary)] transition-colors">
                  Study Groups Dashboard
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
                  Home &amp; Overview
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Column (capped at 2 real links) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--text-primary)]">
              Account
            </h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>
                <Link href="/profile" className="hover:text-[var(--text-primary)] transition-colors">
                  Profile &amp; Account Settings
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-[var(--text-primary)] transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Status Bottom Bar (only real links and facts) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--text-secondary)]">
          <p>
            © 2026 StudyGroup+. Built with Next.js, Neon PostgreSQL, LiveKit, and Clerk.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/lounges" className="hover:text-[var(--text-primary)] transition-colors">
              Go to Dashboard
            </Link>
            <span>•</span>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
