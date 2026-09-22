"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, User, LogOut } from "lucide-react";
import { UserButton, useUser, SignOutButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AppHeaderProps {
  activeLoungesCount?: number;
}

export function AppHeader({}: AppHeaderProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Study Groups", href: "/lounges" },
    { label: "Profile & Settings", href: "/profile" },
  ];

  // Real notification queue (empty by default)
  const notifications: Array<{ id: string; message: string; time: string }> = [];

  return (
    <header className="w-full sticky top-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-md border-b border-[var(--border-hairline)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-4">
          <Link href="/lounges" className="flex items-baseline gap-1 group">
            <span className="font-serif text-2xl font-normal tracking-tight text-[var(--text-primary)] hover:opacity-80 transition-opacity">
              StudyGroup<span className="italic font-normal">+</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-sans">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/lounges" && pathname === "/lounges");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`py-1.5 font-medium transition-colors duration-[var(--dur-fast)] relative ${
                  isActive
                    ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search, Notifications, User Profile, Log Out */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search documents, notes..."
              className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs py-1.5 pl-9 pr-3 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors duration-[var(--dur-fast)] font-sans"
            />
          </div>

          {/* Stateful Notification Menu */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {/* Only show notification dot when there is actually a notification */}
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e5484d]" />
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-72 p-3 bg-[var(--bg-overlay)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] z-50 font-sans text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)] mb-2 font-mono text-[0.6875rem] text-[var(--text-secondary)] uppercase">
                  <span>Notifications</span>
                  <span>{notifications.length} New</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-[var(--text-secondary)]">
                    <p className="font-sans text-xs">No new notifications</p>
                    <p className="font-mono text-[0.625rem] text-[var(--text-disabled)] mt-1">
                      Updates on group activity will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 rounded bg-[var(--bg-inset)] text-[var(--text-primary)]">
                        <p>{n.message}</p>
                        <span className="font-mono text-[0.625rem] text-[var(--text-secondary)]">{n.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle size="sm" />

          {/* Profile Shortcut & User Button */}
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-hairline)]">
            <Link
              href="/profile"
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] cursor-pointer"
              title="Account & Profile Settings"
            >
              <User className="w-4 h-4" />
            </Link>

            <UserButton
              appearance={{
                elements: {
                  avatarBox:
                    "w-8 h-8 rounded-[var(--radius-button)] border border-[var(--border-hairline)]",
                },
              }}
            />
            {user && (
              <span className="hidden xl:inline-block font-mono text-xs text-[var(--text-secondary)]">
                {user.firstName || user.username || "Member"}
              </span>
            )}

            {/* Log Out Button (Clean, Non-wrapping, Proper Alignment) */}
            <SignOutButton redirectUrl="/">
              <button
                type="button"
                className="whitespace-nowrap shrink-0 px-3 py-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] flex items-center gap-1.5 cursor-pointer shadow-none"
                title="Log Out of StudyGroup+"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Log Out</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </header>
  );
}
