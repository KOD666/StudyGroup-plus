"use client";

import React from "react";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="bg-[#171615] text-[#f4f2eb] border-t border-[#32302f] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#32302f]">
          {/* Brand Atelier Column */}
          <div className="lg:col-span-6 space-y-3">
            <Link href="/" className="inline-block font-serif text-2xl font-bold tracking-tight text-[#faf9f6]">
              StudyGroup<span className="text-[#ba5d1a] font-normal">+</span>
            </Link>
            <p className="font-sans text-sm text-[#e6e2df]/80 leading-relaxed max-w-md">
              A collaborative study workspace where video meetings live directly inside your shared
              reading documents, notes, and group archives.
            </p>
          </div>

          {/* Navigation Column (capped at 2 real links) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#e6e2df]">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-[#e6e2df]/70">
              <li>
                <Link href="/lounges" className="hover:text-[#faf9f6] transition-colors">
                  Study Groups Dashboard
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-[#faf9f6] transition-colors">
                  Home &amp; Overview
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Column (capped at 2 real links) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#e6e2df]">
              Account
            </h4>
            <ul className="space-y-2 text-sm text-[#e6e2df]/70">
              <li>
                <Link href="/profile" className="hover:text-[#faf9f6] transition-colors">
                  Profile &amp; Account Settings
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-[#faf9f6] transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Status Bottom Bar (only real links and facts) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#e6e2df]/60">
          <p>
            © 2026 StudyGroup+. Built with Next.js, Neon PostgreSQL, LiveKit, and Clerk.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/lounges" className="hover:text-[#faf9f6] transition-colors">
              Go to Dashboard
            </Link>
            <span>•</span>
            <a href="#" className="hover:text-[#faf9f6] transition-colors">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
