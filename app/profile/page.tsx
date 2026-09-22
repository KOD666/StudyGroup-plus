"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, UserProfile, SignOutButton } from "@clerk/nextjs";
import {
  Mail,
  Calendar,
  BookOpen,
  ArrowRight,
  Shield,
  Clock,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/theme/ThemeProvider";
import { RouteTransition } from "@/components/motion/RouteTransition";

interface GroupItem {
  id: string;
  name: string;
  role: "creator" | "member";
  joinedAt: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await fetch("/api/groups");
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groups || []);
        }
      } catch (err) {
        console.warn("Could not load user groups for profile:", err);
      } finally {
        setIsLoadingGroups(false);
      }
    }

    if (isLoaded && user) {
      loadGroups();
    }
  }, [isLoaded, user]);

  const createdCount = groups.filter((g) => g.role === "creator").length;
  const memberCount = groups.filter((g) => g.role === "member").length;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently joined";

  return (
    <RouteTransition className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)] selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)]">
      <AppHeader activeLoungesCount={groups.length} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)] mb-6 text-xs text-[var(--text-secondary)] font-mono">
          <div className="flex items-center gap-2">
            <Link
              href="/lounges"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              Study Groups
            </Link>
            <span className="text-[var(--text-disabled)]">/</span>
            <span className="text-[var(--text-primary)] font-medium">Account Settings</span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
            <span>Profile Synchronized</span>
          </div>
        </div>

        {/* Page Title & Intro */}
        <div className="pb-8 border-b border-[var(--border-hairline)] mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Account Settings &amp; Profile
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)] mb-2">
            Account &amp; Study Register
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Manage your personal profile, authentication credentials, and study
            group memberships.
          </p>
        </div>

        {/* App-Specific Metadata Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Card 1: User Identity Details */}
          <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-primary)] flex items-center justify-center font-mono text-base font-semibold">
                  {user?.firstName
                    ? user.firstName.substring(0, 2).toUpperCase()
                    : user?.fullName
                      ? user.fullName.substring(0, 2).toUpperCase()
                      : "SG"}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                    {user?.fullName || user?.firstName || "Study Group Member"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>
                      {user?.primaryEmailAddress?.emailAddress ||
                        "No email on file"}
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant="neutral">Active</Badge>
            </div>

            <div className="pt-4 border-t border-[var(--border-hairline)] space-y-2 text-xs font-mono text-[var(--text-secondary)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Member Since
                </span>
                <span className="text-[var(--text-primary)]">
                  {memberSince}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Account ID
                </span>
                <span className="text-[var(--text-secondary)]">
                  {user?.id ? `${user.id.substring(0, 16)}...` : "Loading..."}
                </span>
              </div>
              <div className="pt-3 mt-1 border-t border-[var(--border-hairline)] flex items-center justify-between">
                <span className="text-xs">Account Session</span>
                <SignOutButton redirectUrl="/">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-inset)] hover:bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs font-mono transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>

          {/* Card 2: Group Participation Details */}
          <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)] mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--text-secondary)]" />
                  <h3 className="font-serif text-base font-normal text-[var(--text-primary)]">
                    Study Group Activity
                  </h3>
                </div>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                  Summary
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center my-4 font-mono">
                <div className="p-3 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)]">
                  <div className="font-serif text-2xl font-normal text-[var(--text-primary)]">
                    {isLoadingGroups ? "—" : groups.length}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                    Enrolled Groups
                  </div>
                </div>

                <div className="p-3 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)]">
                  <div className="font-serif text-2xl font-normal text-[var(--text-primary)]">
                    {isLoadingGroups ? "—" : createdCount}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
                    Created by You
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between font-mono">
              <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {memberCount} joined as member
              </span>
              <Link href="/lounges">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  View Groups
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Theme & Reading Atmosphere Card */}
        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-6 mb-10">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)] mb-5">
            <div>
              <h2 className="font-serif text-xl font-normal text-[var(--text-primary)]">
                Reading Atmosphere &amp; Theme
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
                Customize your reading environment for light or dark editorial study.
              </p>
            </div>
            <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] px-2 py-0.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] text-[var(--text-secondary)]">
              Active: {resolvedTheme === "dark" ? "Dark" : "Light"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Option 1: Light */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-[var(--radius-card)] border text-left transition-colors duration-[var(--dur-fast)] flex flex-col justify-between cursor-pointer ${
                theme === "light"
                  ? "border-[var(--border-focus)] bg-[var(--bg-overlay)]"
                  : "border-[var(--border-hairline)] hover:border-[var(--border-hover)] bg-[var(--bg-inset)]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-primary)]">
                  <Sun className="w-4 h-4" />
                </div>
                {theme === "light" && (
                  <span className="w-2 h-2 rounded-full bg-[var(--text-primary)]" />
                )}
              </div>
              <div>
                <div className="font-serif text-sm font-normal text-[var(--text-primary)]">
                  Daylight Reading
                </div>
                <div className="font-sans text-xs text-[var(--text-secondary)] mt-1">
                  High-contrast daylight theme with monochrome typography.
                </div>
              </div>
            </button>

            {/* Option 2: Dark */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-[var(--radius-card)] border text-left transition-colors duration-[var(--dur-fast)] flex flex-col justify-between cursor-pointer ${
                theme === "dark"
                  ? "border-[var(--border-focus)] bg-[var(--bg-overlay)]"
                  : "border-[var(--border-hairline)] hover:border-[var(--border-hover)] bg-[var(--bg-inset)]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-primary)]">
                  <Moon className="w-4 h-4" />
                </div>
                {theme === "dark" && (
                  <span className="w-2 h-2 rounded-full bg-[var(--text-primary)]" />
                )}
              </div>
              <div>
                <div className="font-serif text-sm font-normal text-[var(--text-primary)]">
                  Nocturnal Study
                </div>
                <div className="font-sans text-xs text-[var(--text-secondary)] mt-1">
                  Near-monochrome stepped surface obsidian dark mode.
                </div>
              </div>
            </button>

            {/* Option 3: System Synchronization */}
            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`p-4 rounded-[var(--radius-card)] border text-left transition-colors duration-[var(--dur-fast)] flex flex-col justify-between cursor-pointer ${
                theme === "system"
                  ? "border-[var(--border-focus)] bg-[var(--bg-overlay)]"
                  : "border-[var(--border-hairline)] hover:border-[var(--border-hover)] bg-[var(--bg-inset)]"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-primary)]">
                  <Monitor className="w-4 h-4" />
                </div>
                {theme === "system" && (
                  <span className="w-2 h-2 rounded-full bg-[var(--text-primary)]" />
                )}
              </div>
              <div>
                <div className="font-serif text-sm font-normal text-[var(--text-primary)]">
                  System Match
                </div>
                <div className="font-sans text-xs text-[var(--text-secondary)] mt-1">
                  Automatically adapts to your operating system appearance.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Clerk UserProfile Section */}
        <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-4 sm:p-8 overflow-hidden">
          <div className="pb-4 border-b border-[var(--border-hairline)] mb-6">
            <h2 className="font-serif text-xl font-normal text-[var(--text-primary)]">
              Security &amp; Credentials
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
              Update your name, authentication methods, connected accounts, and
              password.
            </p>
          </div>

          <div className="flex justify-center">
            <UserProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full shadow-none",
                  card: "shadow-none border-0 p-0 w-full bg-transparent",
                  navbar: "border-r border-[var(--border-hairline)] bg-[var(--bg-inset)]",
                  navbarButton:
                    "text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-sans text-xs",
                  navbarButtonActive:
                    "text-[var(--text-primary)] font-semibold bg-[var(--bg-elevated)]",
                  headerTitle: "font-serif text-xl text-[var(--text-primary)] font-normal",
                  headerSubtitle: "font-sans text-xs text-[var(--text-secondary)]",
                  formButtonPrimary:
                    "bg-[var(--invert-bg)] hover:bg-white text-[var(--invert-text)] font-sans text-xs font-semibold rounded-[var(--radius-button)] transition-colors shadow-none",
                  badge:
                    "bg-[var(--bg-inset)] text-[var(--text-secondary)] border border-[var(--border-hairline)]",
                },
              }}
            />
          </div>
        </div>
      </main>
    </RouteTransition>
  );
}
