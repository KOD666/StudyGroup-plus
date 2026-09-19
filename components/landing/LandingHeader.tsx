"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Bell, BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";

export function LandingHeader() {
  const { isSignedIn } = useAuth();
  const [currentTime, setCurrentTime] = useState("14:32 GMT");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      setCurrentTime(`${hours}:${minutes} GMT`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full sticky top-0 z-50 bg-[#fdf8f6]/95 backdrop-blur-sm border-b border-[#e5e2d9]">
      {/* Top Ticker Bar */}
      <div className="w-full bg-[#f4f2eb] border-b border-[#e5e2d9] px-4 py-1.5 text-xs text-[#5e5a54] flex flex-wrap items-center justify-between gap-2 font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#234338] inline-block animate-pulse" />
          <span className="font-semibold uppercase tracking-[0.08em] text-[#234338]">
            Live Study Room Active:
          </span>
          <span className="text-[#171615]">
            Ethics &amp; Agency Seminar — 4 members studying together
          </span>
        </div>
        <div className="flex items-center gap-4 text-[0.6875rem] font-medium tracking-wider uppercase text-[#78746d]">
          <span className="hidden sm:inline">
            Reading: Aristotle, Nicomachean Ethics Bk. III
          </span>
          <span className="text-[#171615] font-semibold">{currentTime}</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Term Tag */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-baseline gap-1 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#171615] group-hover:text-[#ba5d1a] transition-colors">
              StudyGroup<span className="text-[#ba5d1a] font-normal">+</span>
            </span>
          </Link>
          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-[0.125rem] border border-[#ddd8cc] bg-[#ffffff] text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#78746d]">
            Study Workspace
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-sans text-[#5e5a54]">
          <a
            href="#features"
            className="hover:text-[#171615] transition-colors relative py-1 hover:border-b hover:border-[#ba5d1a]"
          >
            Features
          </a>
          <a
            href="#workspace"
            className="hover:text-[#171615] transition-colors relative py-1 hover:border-b hover:border-[#ba5d1a]"
          >
            Workspace
          </a>
          <a
            href="#about"
            className="hover:text-[#171615] transition-colors relative py-1 hover:border-b hover:border-[#ba5d1a]"
          >
            About
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search study materials"
            className="p-2 text-[#78746d] hover:text-[#171615] hover:bg-[#f2edeb] rounded-[0.25rem] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="p-2 text-[#78746d] hover:text-[#171615] hover:bg-[#f2edeb] rounded-[0.25rem] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#ba5d1a]" />
          </button>

          {isSignedIn ? (
            <Link href="/lounges">
              <Button variant="primary" size="sm" icon={<BookOpen className="w-3.5 h-3.5" />}>
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
