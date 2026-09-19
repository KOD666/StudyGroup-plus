"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  BookOpen,
  Plus,
  Clock,
  ArrowRight,
  AlertCircle,
  Calendar,
  Volume2,
  ExternalLink,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { CreateLoungeModal } from "@/components/lounges/CreateLoungeModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";

interface GroupItem {
  id: string;
  name: string;
  description: string | null;
  code: string;
  creatorId: string;
  createdAt: string;
  role: "creator" | "member";
  joinedAt: string;
}

interface RecentAsset {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  fileType: string;
  sizeBytes: number;
  createdAt: string;
}

export default function LoungesDashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [despatchTime, setDespatchTime] = useState("09:42 AM");

  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setDespatchTime(timeStr);
  }, []);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please sign in to view your study groups.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load study groups");
      }
      const data = await res.json();
      setGroups(data.groups || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load study groups");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRecentNotes = useCallback(async () => {
    setIsLoadingRecent(true);
    try {
      const res = await fetch("/api/assets?recent=true");
      if (res.ok) {
        const data = await res.json();
        setRecentAssets(data.assets || []);
      }
    } catch (err) {
      console.warn("Could not load recent assets:", err);
    } finally {
      setIsLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    if (isUserLoaded) {
      fetchGroups();
      fetchRecentNotes();
    }
  }, [isUserLoaded, fetchGroups, fetchRecentNotes]);

  const scholarName = user?.firstName || user?.fullName || "Member";
  const activeLounge = groups[0] || null;

  return (
    <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans selection:bg-[#ffdbc9] selection:text-[#171615]">
      <AppHeader activeLoungesCount={groups.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Overview Greeting Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#e5e2d9] mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#78746d]">
                Study Dashboard • {despatchTime}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-normal text-[#171615]">
              Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
              <span className="italic font-normal">{scholarName}</span>.{" "}
              {groups.length > 0
                ? `You have ${groups.length} active study ${groups.length === 1 ? "group" : "groups"}.`
                : "Create or join a study group to get started."}
            </h1>
          </div>

          {/* Quick Ticker Chips */}
          <div className="flex items-center gap-3 self-start lg:self-end">
            <div className="px-3 py-2 rounded-[0.25rem] bg-[#ffffff] border border-[#e5e2d9] flex items-center gap-2.5 text-xs shadow-xs transition-all duration-150">
              <span className="w-2 h-2 rounded-full bg-[#234338] animate-pulse" />
              <span className="font-semibold text-[#171615]">
                {activeLounge ? activeLounge.name.split(":")[0] : "STUDY ROOM"}
              </span>
              <span className="text-[#78746d]">
                {activeLounge ? "Meeting room ready" : "No active meeting"}
              </span>
            </div>
          </div>
        </div>

        {/* Error Notification with Retry */}
        {error && (
          <div className="mb-8 p-4 bg-[#fffaf5] border border-[#ba5d1a]/40 rounded-[0.25rem] flex items-start justify-between gap-4 transition-all duration-150">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#ba5d1a] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans text-sm font-semibold text-[#171615]">
                  Unable to Load Study Groups
                </h4>
                <p className="font-sans text-xs text-[#5e5a54] mt-0.5">{error}</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchGroups}>
              Try Again
            </Button>
          </div>
        )}

        {/* Main 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Active Seminar Banner + Enrolled Lounges */}
          <div className="lg:col-span-8 space-y-8">
            {/* Active Live Seminar Card */}
            {activeLounge ? (
              <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] shadow-paper-contact hover:shadow-paper-floating transition-all duration-200 overflow-hidden">
                <div className="p-6 sm:p-7 bg-[#faf9f6]/40">
                  {/* Banner Sub-Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="forest" dot>
                        Live Study Room Available
                      </Badge>
                      <span className="text-xs font-sans text-[#78746d]">
                        Invite Code: #{activeLounge.code}
                      </span>
                    </div>
                    <span className="font-editorial italic text-xs text-[#5e5a54] flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-[#234338]" /> Focus Mode
                    </span>
                  </div>

                  {/* Lounge Title & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
                    <div>
                      <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[#78746d] block mb-1">
                        {activeLounge.role === "creator" ? "Your Study Group" : "Joined Study Group"}
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#171615]">
                        {activeLounge.name}
                      </h2>
                    </div>

                    <Link href={`/lounges/${activeLounge.id}/room`}>
                      <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                        Join Live Room
                      </Button>
                    </Link>
                  </div>

                  {/* Current Text Callout */}
                  <div className="p-4 bg-[#f4f2eb] border border-[#e5e2d9] rounded-[0.25rem] mb-6 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#78746d] block mb-0.5">
                        Current Topic &amp; Materials
                      </span>
                      <p className="font-editorial italic text-sm text-[#171615]">
                        {activeLounge.description || "Shared study notes, reading lists, and discussion materials"}
                      </p>
                    </div>
                    <span className="font-sans text-xs px-2 py-1 bg-[#ffffff] border border-[#ddd8cc] rounded-[0.125rem] text-[#5e5a54] shrink-0 font-medium">
                      Notes
                    </span>
                  </div>

                  {/* Presence Row */}
                  <div className="pt-4 border-t border-[#e5e2d9] flex flex-wrap items-center justify-between gap-4 text-xs font-sans text-[#78746d]">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#234338] text-[0.625rem] font-bold text-[#faf9f6] ring-2 ring-[#ffffff]">
                        {scholarName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[#171615] font-medium">
                        {scholarName} • Ready to collaborate
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#5e5a54]">
                      <Clock className="w-3.5 h-3.5 text-[#78746d]" />
                      <span>Live video room available</span>
                    </div>
                  </div>
                </div>

                {/* Attached Folios Desk Sub-bar */}
                <div className="px-6 py-3.5 bg-[#faf9f6] border-t border-[#e5e2d9] flex flex-wrap items-center justify-between gap-4">
                  <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#78746d]">
                    Shared Group Materials
                  </span>
                  <Link
                    href={`/lounges/${activeLounge.id}`}
                    className="font-editorial italic text-xs text-[#ba5d1a] hover:underline inline-flex items-center gap-1 transition-all duration-150"
                  >
                    Open Study Group <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Enrolled Academic Lounges Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#171615]">
                  Your Study Groups
                </h3>
                <span className="font-sans text-xs uppercase tracking-[0.08em] text-[#78746d]">
                  {groups.length} {groups.length === 1 ? "Group" : "Groups"}
                </span>
              </div>

              {isLoading ? (
                /* Loading Skeletons */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-6 bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] animate-pulse space-y-4"
                    >
                      <div className="h-4 bg-[#e5e2d9]/60 rounded w-1/3" />
                      <div className="h-6 bg-[#e5e2d9]/80 rounded w-3/4" />
                      <div className="h-12 bg-[#e5e2d9]/40 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                /* Empty State */
                <div className="p-10 text-center bg-[#ffffff] rounded-[0.25rem] border border-dashed border-[#ddd8cc]">
                  <div className="w-12 h-12 rounded-[0.25rem] bg-[#f4f2eb] border border-[#e5e2d9] flex items-center justify-center mx-auto mb-4 text-[#ba5d1a]">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-lg font-normal text-[#171615] mb-2">
                    No Study Groups Yet
                  </h4>
                  <p className="font-sans text-sm text-[#5e5a54] max-w-md mx-auto mb-6">
                    You haven&apos;t created or joined any study groups yet. Create a new study
                    group or enter an invite code to join one.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                      Create a Study Group
                    </Button>
                  </div>
                </div>
              ) : (
                /* Grid of Lounges */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => (
                    <Card
                      key={group.id}
                      variant="ivory"
                      className="group flex flex-col justify-between hover:border-[#ddd8cc] hover:-translate-y-0.5 hover:shadow-paper-floating transition-all duration-200"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[#78746d]">
                            Invite Code #{group.code}
                          </span>
                          <Badge variant={group.role === "creator" ? "ochre" : "parchment"}>
                            {group.role === "creator" ? "Owner" : "Member"}
                          </Badge>
                        </div>
                        <h4 className="font-serif text-lg font-normal text-[#171615] group-hover:text-[#ba5d1a] transition-colors duration-150 leading-snug">
                          {group.name}
                        </h4>
                      </CardHeader>

                      <CardContent className="pt-0 flex-1">
                        <p className="font-sans text-xs text-[#5e5a54] line-clamp-3 leading-relaxed">
                          {group.description || "Shared workspace for notes, readings, and video study sessions."}
                        </p>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between text-xs">
                        <span className="font-editorial italic text-[#78746d]">
                          Joined {new Date(group.joinedAt).toLocaleDateString()}
                        </span>
                        <Link
                          href={`/lounges/${group.id}`}
                          className="font-sans font-semibold text-xs text-[#ba5d1a] hover:text-[#a24e14] flex items-center gap-1 transition-colors duration-150"
                        >
                          Open Group <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Actions & Tools */}
          <div className="lg:col-span-4 space-y-6">
            {/* Create Study Group Callout Card */}
            <div className="p-6 bg-[#faf9f6] rounded-[0.25rem] border border-dashed border-[#ddd8cc] hover:border-[#ba5d1a] transition-colors duration-200 text-center">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-10 h-10 rounded-[0.25rem] bg-[#ffffff] border border-[#ddd8cc] text-[#ba5d1a] hover:bg-[#ba5d1a] hover:text-[#ffffff] transition-all duration-200 flex items-center justify-center mx-auto mb-3"
              >
                <Plus className="w-5 h-5" />
              </button>
              <h4 className="font-serif text-base font-normal text-[#171615] mb-1">
                Create a Study Group
              </h4>
              <p className="font-sans text-xs text-[#5e5a54] mb-4">
                Set up a shared study space, upload files and notes, and invite friends.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setIsModalOpen(true)}
              >
                Create Study Group
              </Button>
            </div>

            {/* Upcoming Study Sessions Card */}
            <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] p-5 shadow-paper-contact hover:shadow-paper-floating transition-all duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e2d9] mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#ba5d1a]" />
                  <h4 className="font-serif text-sm font-normal text-[#171615]">
                    Upcoming Study Sessions
                  </h4>
                </div>
                <span className="font-sans text-[0.625rem] uppercase tracking-[0.08em] text-[#78746d]">
                  Schedule
                </span>
              </div>

              <div className="p-4 bg-[#faf9f6] rounded-[0.25rem] border border-dashed border-[#ddd8cc] text-center">
                <Calendar className="w-6 h-6 text-[#78746d] mx-auto mb-2 opacity-50" />
                <p className="font-serif text-xs text-[#171615] font-medium mb-1">
                  No Scheduled Sessions
                </p>
                <p className="font-sans text-[0.6875rem] text-[#78746d] leading-relaxed">
                  Scheduled calendar sessions are not supported in the database schema. Join or start a live room directly from your study groups.
                </p>
              </div>
            </div>

            {/* Recent Notes & Documents */}
            <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] p-5 shadow-paper-contact hover:shadow-paper-floating transition-all duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e2d9] mb-4">
                <h4 className="font-serif text-sm font-normal text-[#171615]">
                  Recent Notes &amp; Documents
                </h4>
                <span className="font-editorial italic text-xs text-[#78746d]">
                  {recentAssets.length} {recentAssets.length === 1 ? "file" : "files"}
                </span>
              </div>

              {isLoadingRecent ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 bg-[#e5e2d9]/50 rounded" />
                  <div className="h-12 bg-[#e5e2d9]/50 rounded" />
                </div>
              ) : recentAssets.length === 0 ? (
                <div className="p-4 bg-[#faf9f6] rounded-[0.25rem] border border-dashed border-[#ddd8cc] text-center">
                  <BookOpen className="w-6 h-6 text-[#78746d] mx-auto mb-2 opacity-50" />
                  <p className="font-serif text-xs text-[#171615] font-medium mb-1">
                    No Recent Notes
                  </p>
                  <p className="font-sans text-[0.6875rem] text-[#78746d] leading-relaxed">
                    Notes and documents uploaded to your study groups will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssets.slice(0, 4).map((asset) => (
                    <Link
                      key={asset.id}
                      href={`/lounges/${asset.groupId}/folios/${asset.id}`}
                      className="block p-3 bg-[#fdf8f6] border-l-2 border-[#ba5d1a] border-y border-r border-[#e5e2d9] rounded-r-[0.25rem] hover:border-l-[#a24e14] hover:bg-[#fff9f6] transition-all duration-150 group"
                    >
                      <p className="font-medium text-xs text-[#171615] group-hover:text-[#ba5d1a] transition-colors truncate mb-1">
                        {asset.title}
                      </p>
                      <div className="flex items-center justify-between text-[0.625rem] font-sans text-[#78746d]">
                        <span className="truncate max-w-[10rem]">{asset.groupName}</span>
                        <span className="uppercase text-[#ba5d1a] font-semibold">
                          {asset.fileType}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Creating / Joining Study Group */}
      <CreateLoungeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoungeCreated={() => {
          fetchGroups();
        }}
      />
    </div>
  );
}
