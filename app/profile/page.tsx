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
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface GroupItem {
  id: string;
  name: string;
  role: "creator" | "member";
  joinedAt: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
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
    <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans selection:bg-[#ffdbc9] selection:text-[#171615]">
      <AppHeader activeLoungesCount={groups.length} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e5e2d9] mb-6 text-xs text-[#78746d]">
          <div className="flex items-center gap-2">
            <Link href="/lounges" className="hover:text-[#171615] transition-colors duration-150">
              Study Groups
            </Link>
            <span>/</span>
            <span className="text-[#171615] font-medium">Account Settings</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#234338] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#234338] animate-pulse" />
            <span>Profile Synchronized</span>
          </div>
        </div>

        {/* Page Title & Intro */}
        <div className="pb-8 border-b border-[#e5e2d9] mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#78746d]">
              Account Settings &amp; Profile
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#171615] mb-2">
            Account &amp; Study Register
          </h1>
          <p className="font-sans text-sm text-[#5e5a54] max-w-2xl">
            Manage your personal profile, authentication credentials, and study group memberships.
          </p>
        </div>

        {/* App-Specific Metadata Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Card 1: User Identity Details */}
          <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] p-6 shadow-paper-contact hover:shadow-paper-floating transition-all duration-200">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[0.25rem] bg-[#234338] text-[#faf9f6] flex items-center justify-center font-serif text-lg font-bold">
                  {user?.firstName
                    ? user.firstName.substring(0, 2).toUpperCase()
                    : user?.fullName
                    ? user.fullName.substring(0, 2).toUpperCase()
                    : "SG"}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-normal text-[#171615]">
                    {user?.fullName || user?.firstName || "Study Group Member"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#78746d] mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user?.primaryEmailAddress?.emailAddress || "No email on file"}</span>
                  </div>
                </div>
              </div>
              <Badge variant="forest">Active</Badge>
            </div>

            <div className="pt-4 border-t border-[#e5e2d9]/60 space-y-2 text-xs font-sans text-[#5e5a54]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#78746d]">
                  <Calendar className="w-3.5 h-3.5" /> Member Since
                </span>
                <span className="font-medium text-[#171615]">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#78746d]">
                  <Shield className="w-3.5 h-3.5" /> Account ID
                </span>
                <span className="font-mono text-[0.6875rem] text-[#78746d]">
                  {user?.id ? `${user.id.substring(0, 16)}...` : "Loading..."}
                </span>
              </div>
              <div className="pt-3 mt-1 border-t border-[#e5e2d9] flex items-center justify-between">
                <span className="text-xs text-[#78746d]">Account Session</span>
                <SignOutButton redirectUrl="/">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#ba1a1a] border border-[#ba1a1a]/30 rounded-[0.25rem] text-xs font-semibold transition-colors duration-150"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>

          {/* Card 2: Group Participation Details */}
          <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] p-6 shadow-paper-contact hover:shadow-paper-floating transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e2d9] mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#ba5d1a]" />
                  <h3 className="font-serif text-base font-normal text-[#171615]">
                    Study Group Activity
                  </h3>
                </div>
                <span className="font-sans text-[0.625rem] uppercase tracking-[0.08em] text-[#78746d]">
                  Summary
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center my-4">
                <div className="p-3 bg-[#faf9f6] rounded-[0.25rem] border border-[#e5e2d9]">
                  <div className="font-serif text-2xl font-normal text-[#171615]">
                    {isLoadingGroups ? "—" : groups.length}
                  </div>
                  <div className="text-[0.6875rem] font-sans text-[#78746d] uppercase tracking-wider mt-0.5">
                    Enrolled Groups
                  </div>
                </div>

                <div className="p-3 bg-[#faf9f6] rounded-[0.25rem] border border-[#e5e2d9]">
                  <div className="font-serif text-2xl font-normal text-[#ba5d1a]">
                    {isLoadingGroups ? "—" : createdCount}
                  </div>
                  <div className="text-[0.6875rem] font-sans text-[#78746d] uppercase tracking-wider mt-0.5">
                    Created by You
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#e5e2d9]/60 flex items-center justify-between">
              <span className="text-xs text-[#78746d] flex items-center gap-1">
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

        {/* Clerk UserProfile Section */}
        <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] p-4 sm:p-8 shadow-paper-contact overflow-hidden">
          <div className="pb-4 border-b border-[#e5e2d9] mb-6">
            <h2 className="font-serif text-xl font-normal text-[#171615]">
              Security &amp; Credentials
            </h2>
            <p className="text-xs text-[#78746d] font-sans mt-0.5">
              Update your name, authentication methods, connected accounts, and password.
            </p>
          </div>

          <div className="flex justify-center">
            <UserProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full shadow-none",
                  card: "shadow-none border-0 p-0 w-full bg-transparent",
                  navbar: "border-r border-[#e5e2d9] bg-[#faf9f6]",
                  navbarButton: "text-[#5e5a54] hover:text-[#171615] font-sans text-xs",
                  navbarButtonActive: "text-[#ba5d1a] font-semibold bg-[#ffdbc9]/30",
                  headerTitle: "font-serif text-xl text-[#171615]",
                  headerSubtitle: "font-sans text-xs text-[#78746d]",
                  formButtonPrimary:
                    "bg-[#ba5d1a] hover:bg-[#a24e14] text-white font-sans text-xs font-semibold rounded-[0.25rem] transition-colors",
                  badge: "bg-[#234338]/10 text-[#234338] border border-[#234338]/30",
                },
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
