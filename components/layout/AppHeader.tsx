"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User, LogOut } from "lucide-react";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";

interface AppHeaderProps {
  activeLoungesCount?: number;
}

export function AppHeader({ activeLoungesCount = 0 }: AppHeaderProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const navItems = [
    { label: "My Groups", href: "/lounges" },
    { label: "Profile & Settings", href: "/profile" },
  ];

  return (
    <header className="w-full sticky top-0 z-40 bg-[#fdf8f6]/95 backdrop-blur-sm border-b border-[#e5e2d9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Group Count Badge */}
        <div className="flex items-center gap-4">
          <Link href="/lounges" className="flex items-baseline gap-1 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#171615] group-hover:text-[#ba5d1a] transition-colors duration-150">
              StudyGroup<span className="text-[#ba5d1a] font-normal">+</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[0.125rem] border border-[#e5e2d9] bg-[#f4f2eb] text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#5e5a54]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#234338]" />
            {activeLoungesCount} Active {activeLoungesCount === 1 ? "Study Group" : "Study Groups"}
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-sans">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/lounges" && pathname === "/lounges");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`py-1.5 font-medium transition-colors duration-150 relative ${
                  isActive
                    ? "text-[#171615] border-b-2 border-[#ba5d1a]"
                    : "text-[#5e5a54] hover:text-[#171615]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search, Notifications, User Profile */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#78746d]" />
            <input
              type="text"
              placeholder="Search documents, notes..."
              className="w-full bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] text-xs py-1.5 pl-9 pr-3 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] focus:ring-1 focus:ring-[#ba5d1a] transition-all duration-150"
            />
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="p-2 text-[#78746d] hover:text-[#171615] hover:bg-[#f2edeb] rounded-[0.25rem] transition-colors duration-150 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#ba5d1a]" />
          </button>

          {/* Profile Shortcut & User Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e5e2d9]">
            <Link
              href="/profile"
              className="p-1.5 text-[#78746d] hover:text-[#171615] hover:bg-[#f2edeb] rounded-[0.25rem] transition-colors duration-150"
              title="Account & Profile Settings"
            >
              <User className="w-4 h-4" />
            </Link>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-[0.25rem] border border-[#ddd8cc]",
                },
              }}
            />
            {user && (
              <span className="hidden xl:inline-block font-sans text-xs font-medium text-[#171615]">
                {user.firstName || user.username || "Member"}
              </span>
            )}

            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="px-2 py-1 text-xs font-medium text-[#78746d] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 border border-[#ddd8cc] rounded-[0.25rem] transition-colors duration-150 flex items-center gap-1.5 shadow-xs"
                title="Log Out of StudyGroup+"
              >
                <LogOut className="w-3.5 h-3.5 text-[#ba1a1a]" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  );
}
