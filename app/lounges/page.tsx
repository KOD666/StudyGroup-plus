"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import {
  Plus,
  ArrowRight,
  AlertCircle,
  Calendar,
  FileText,
  CheckCircle2,
  LayoutGrid,
  Radio,
  FolderArchive,
  MessageSquare,
  Settings,
  HelpCircle,
  KeyRound,
  Download,
  Users,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { CreateLoungeModal } from "@/components/lounges/CreateLoungeModal";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { GreetingClock } from "@/components/dashboard/GreetingClock";
import { RouteTransition } from "@/components/motion/RouteTransition";
import { CardSpotlight } from "@/components/motion/CardSpotlight";
import { MagneticSkew } from "@/components/motion/MagneticSkew";
import { ArrowHover } from "@/components/motion/ArrowHover";

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
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const shouldReduceMotion = useReducedMotion();

  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"create" | "join">("create");
  const [activeLiveGroup, setActiveLiveGroup] = useState<GroupItem | null>(null);

  const checkActiveLiveGroups = useCallback(async (groupItems: GroupItem[]) => {
    for (const g of groupItems) {
      try {
        const res = await fetch(`/api/groups/${g.id}/sessions/active`);
        if (res.ok) {
          const data = await res.json();
          if (data.active && data.session) {
            setActiveLiveGroup(g);
            return;
          }
        }
      } catch {
        // continue checking
      }
    }
    setActiveLiveGroup(null);
  }, []);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) {
        throw new Error(`Failed to fetch study groups (${res.status})`);
      }
      const data = await res.json();
      const loadedGroups = data.groups || [];
      setGroups(loadedGroups);
      checkActiveLiveGroups(loadedGroups);
    } catch (err: unknown) {
      console.error("Error fetching study groups:", err);
      setError(err instanceof Error ? err.message : "Failed to load study groups");
    } finally {
      setIsLoading(false);
    }
  }, [checkActiveLiveGroups]);

  const fetchRecentAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/assets?recent=true");
      if (res.ok) {
        const data = await res.json();
        setRecentAssets(data.assets || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching recent assets:", err);
    }
  }, []);

  useEffect(() => {
    if (isUserLoaded && user) {
      fetchGroups();
      fetchRecentAssets();
    } else if (isUserLoaded && !user) {
      setIsLoading(false);
    }
  }, [isUserLoaded, user, fetchGroups, fetchRecentAssets]);

  const scholarName = user?.firstName || user?.username || "Member";
  const activeLounge = activeLiveGroup;

  const getCardDelay = (index: number) => {
    if (shouldReduceMotion) return 0;
    const total = Math.max(1, groups.length);
    const step = Math.min(0.06, 0.5 / total);
    return index * step;
  };

  const handleCardClick = (groupId: string) => {
    setTimeout(() => {
      router.push(`/lounges/${groupId}`);
    }, shouldReduceMotion ? 0 : 80);
  };

  return (
    <RouteTransition className="bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)] selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)] min-h-screen">
      <AppHeader activeLoungesCount={groups.length} />

      <div className="flex-1 w-full max-w-[1536px] mx-auto flex">
        {/* Left Sidebar Navigation (Stitched to real application routes) */}
        <aside className="hidden xl:flex flex-col w-60 shrink-0 border-r border-[var(--border-hairline)] bg-[var(--bg-primary)] p-5 space-y-7 min-h-[calc(100vh-4rem)]">
          {/* Workspace Title */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-[var(--text-primary)] inline-block rounded-[1px]" />
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider font-semibold text-[var(--text-primary)] truncate">
                Study Workspace
              </span>
            </div>
            <div className="font-mono text-[0.625rem] uppercase tracking-wider text-[var(--text-secondary)] pl-4">
              Personal Dashboard
            </div>
          </div>

          {/* Action Buttons: Create & Join */}
          <div className="space-y-2">
            <button
              type="button"
              data-magnetic
              onClick={() => {
                setModalTab("create");
                setIsModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-white active:scale-[0.97] transition-all duration-[var(--dur-fast)] cursor-pointer flex items-center justify-center gap-1.5 shadow-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Group</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalTab("join");
                setIsModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-none"
            >
              <KeyRound className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span>Join with Code</span>
            </button>
          </div>

          {/* Navigation Links (Stitched to real pages) */}
          <nav className="space-y-1 font-sans text-xs">
            <Link
              href="/lounges"
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium border border-[var(--border-hairline)]"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[var(--text-primary)]" />
              <span>Overview</span>
            </Link>

            <Link
              href={
                activeLounge
                  ? `/lounges/${activeLounge.id}/room`
                  : "/lounges"
              }
              onClick={(e) => {
                if (!activeLounge) {
                  e.preventDefault();
                  setModalTab("create");
                  setIsModalOpen(true);
                }
              }}
              className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Radio className="w-3.5 h-3.5 group-hover:text-[var(--text-primary)] text-[var(--text-secondary)]" />
                <span>Live Sessions</span>
              </div>
              {activeLounge && (
                <span className="w-2 h-2 rounded-full bg-[#e5484d] animate-live-breathe" />
              )}
            </Link>

            <Link
              href={activeLounge ? `/lounges/${activeLounge.id}` : "/lounges"}
              onClick={(e) => {
                if (!activeLounge) {
                  e.preventDefault();
                  setModalTab("create");
                  setIsModalOpen(true);
                }
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Shared Notes</span>
            </Link>

            <Link
              href={activeLounge ? `/lounges/${activeLounge.id}` : "/lounges"}
              onClick={(e) => {
                if (!activeLounge) {
                  e.preventDefault();
                  setModalTab("create");
                  setIsModalOpen(true);
                }
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Asset Library</span>
            </Link>

            <Link
              href={activeLounge ? `/lounges/${activeLounge.id}` : "/lounges"}
              onClick={(e) => {
                if (!activeLounge) {
                  e.preventDefault();
                  setModalTab("create");
                  setIsModalOpen(true);
                }
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discussion Board</span>
            </Link>
          </nav>

          {/* Bottom Settings & Docs */}
          <div className="pt-6 border-t border-[var(--border-hairline)] space-y-1 font-sans text-xs text-[var(--text-secondary)] mt-auto">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius-button)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-[var(--radius-button)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Documentation</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          data-inertia-scroll
          className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8"
        >
          {/* Top Header & Greeting Bar */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[var(--border-hairline)]">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-[var(--text-primary)] inline-block rounded-[1px]" />
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  Matriculation Academic Archive
                </span>
              </div>
              <h1 className="font-serif text-[clamp(2.5rem,4vw,3.5rem)] leading-none font-normal text-[var(--text-primary)] tracking-normal">
                Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
                <span className="italic font-normal">{scholarName}</span>
              </h1>
            </div>

            {/* Right Header: Greeting Clock (Removed academic term 2025 per instruction) */}
            <div className="flex items-center self-start lg:self-end px-3.5 py-1.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
              <GreetingClock />
            </div>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-focus)] rounded-[var(--radius-card)] flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--text-primary)] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-sans text-sm font-medium text-[var(--text-primary)]">
                    Unable to Load Study Groups
                  </h4>
                  <p className="font-sans text-xs text-[var(--text-secondary)] mt-0.5">{error}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={fetchGroups}>
                Retry
              </Button>
            </div>
          )}

          {/* Active Live Room Banner (Only shown when an actual group room exists) */}
          {activeLounge && (
            <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-6 sm:p-7 relative overflow-hidden transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-button)] border border-[rgba(229,72,77,0.4)] bg-[rgba(229,72,77,0.12)] text-[#e5484d] font-mono text-xs uppercase tracking-wider font-semibold">
                      <span className="w-2 h-2 rounded-full bg-[#e5484d] animate-live-breathe" />
                      Live Study Room Active
                    </span>
                    <span className="font-mono text-xs text-[var(--text-secondary)] px-2 py-0.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)]">
                      Invite Code: #{activeLounge.code}
                    </span>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {activeLounge.role === "creator" ? "Host" : "Enrolled"}
                    </span>
                  </div>

                  <h2 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {activeLounge.name}
                  </h2>

                  <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {activeLounge.description ||
                      "Active study group workspace with collaborative notes, shared documents, and live video meeting."}
                  </p>
                </div>

                <Link href={`/lounges/${activeLounge.id}/room`}>
                  <button
                    type="button"
                    data-magnetic
                    className="magnetic-cta px-5 py-2.5 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] font-sans text-xs font-semibold uppercase tracking-wider hover:bg-white active:scale-[0.97] transition-all duration-[var(--dur-fast)] shadow-none flex items-center gap-2 cursor-pointer"
                  >
                    <span>Enter Live Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* 2-Column Grid: Groups Section (8 cols) + Right Sidebar (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Study Groups Section */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
                <div className="flex items-center gap-3">
                  <h3 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    Active Study Groups
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] text-[var(--text-secondary)]">
                    {String(groups.length).padStart(2, "0")} Enrolled
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<KeyRound className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setModalTab("join");
                      setIsModalOpen(true);
                    }}
                  >
                    Join with Code
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setModalTab("create");
                      setIsModalOpen(true);
                    }}
                  >
                    Convene Group
                  </Button>
                </div>
              </div>

              {isLoading ? (
                /* Skeleton Loading Shimmer */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-6 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-4 overflow-hidden relative"
                    >
                      <div className="h-4 w-1/3 rounded-[var(--radius-button)] skeleton-shimmer" />
                      <div className="h-6 w-3/4 rounded-[var(--radius-button)] skeleton-shimmer" />
                      <div className="h-12 w-full rounded-[var(--radius-button)] skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              ) : groups.length === 0 ? (
                /* Authentic Empty State (No hardcoded fake rooms) */
                <div className="p-12 text-center rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-4">
                  <div className="w-12 h-12 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto text-[var(--text-secondary)]">
                    <Users className="w-6 h-6 text-[var(--text-secondary)]" />
                  </div>
                  <h4 className="font-sans text-lg font-semibold text-[var(--text-primary)]">
                    No Active Study Groups
                  </h4>
                  <p className="font-sans text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                    Create your first study group or enter an invite code to start collaborating with your peers.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setModalTab("create");
                        setIsModalOpen(true);
                      }}
                    >
                      Create Study Group
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<KeyRound className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setModalTab("join");
                        setIsModalOpen(true);
                      }}
                    >
                      Join with Code
                    </Button>
                  </div>
                </div>
              ) : (
                /* Only real user-created groups */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups.map((group, idx) => (
                    <motion.div
                      key={group.id}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0.15 : 0.45,
                        delay: getCardDelay(idx),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                      onClick={() => handleCardClick(group.id)}
                      className="cursor-pointer h-full"
                    >
                      <MagneticSkew transformFactor={0.05} rotateFactor={0.04} className="h-full">
                        <CardSpotlight glowColor="rgba(239, 70, 57, 0.08)" borderColor="rgba(239, 70, 57, 0.3)" className="h-full rounded-[var(--radius-card)]">
                          <Card
                            variant="elevated"
                            className="group flex flex-col justify-between h-full hover:border-[var(--border-hover)] transition-all duration-[var(--dur-fast)]"
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[0.6875rem] uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] text-[var(--text-secondary)]">
                                  #{group.code}
                                </span>
                                <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                                  {group.role === "creator" ? "Owner" : "Member"}
                                </span>
                              </div>
                              <h4 className="font-serif text-lg font-normal text-[var(--text-primary)] group-hover:underline transition-colors leading-snug tracking-normal">
                                {group.name}
                              </h4>
                            </CardHeader>

                            <CardContent className="pt-0 flex-1">
                              <p className="font-sans text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                                {group.description ||
                                  "Shared study workspace with documents, notes, and live video meeting."}
                              </p>
                            </CardContent>

                            <CardFooter className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)] pt-3 border-t border-[var(--border-hairline)]">
                              <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1.5 group-hover:text-[var(--text-primary)] transition-colors text-xs font-mono">
                                Enter Workspace <ArrowHover size={14} />
                              </span>
                            </CardFooter>
                          </Card>
                        </CardSpotlight>
                      </MagneticSkew>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Milestone Progress Bar (Only shown when user has groups) */}
              {groups.length > 0 && (
                <div className="p-4 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)]" />
                    <div>
                      <div className="font-sans text-xs font-medium text-[var(--text-primary)]">
                        Active Study Enrolment
                      </div>
                      <div className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                        {groups.length} {groups.length === 1 ? "group" : "groups"} active in your workspace
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 sm:w-44 h-1.5 rounded-full bg-[var(--bg-inset)] overflow-hidden">
                      <div className="h-full bg-[var(--text-primary)] rounded-full w-full" />
                    </div>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">100%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0.15 : 0.45,
                delay: shouldReduceMotion ? 0 : 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="lg:col-span-4 space-y-6"
            >
              {/* Upcoming Sessions Card (Clean, Authentic State) */}
              <div className="p-5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)] mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                      Upcoming Sessions
                    </span>
                  </div>
                  <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)] uppercase">
                    Schedule
                  </span>
                </div>

                <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                  <p className="font-sans">No upcoming sessions scheduled</p>
                  <p className="font-mono text-[0.625rem] text-[var(--text-disabled)] mt-1">
                    Start a live video room anytime from your workspace
                  </p>
                </div>
              </div>

              {/* Recent Notes & Transcripts (Wired to Real Assets) */}
              <div className="p-5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)] mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                      Recent Notes &amp; Transcripts
                    </span>
                  </div>
                  <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                    {recentAssets.length} Files
                  </span>
                </div>

                {recentAssets.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentAssets.slice(0, 5).map((asset) => (
                      <Link
                        key={asset.id}
                        href={`/lounges/${asset.groupId}/folios/${asset.id}`}
                        className="p-2.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] flex items-center justify-between gap-3 group hover:border-[var(--border-hover)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                          <div className="min-w-0">
                            <div className="font-mono text-xs text-[var(--text-primary)] truncate group-hover:underline">
                              {asset.title}
                            </div>
                            <div className="font-mono text-[0.625rem] text-[var(--text-secondary)] truncate">
                              {asset.groupName}
                            </div>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
                    <p className="font-sans">No notes or transcripts yet</p>
                    <p className="font-mono text-[0.625rem] text-[var(--text-disabled)] mt-1">
                      Uploaded documents and session transcripts will appear here
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>

      {/* Footer (Clean Grounded Editorial Footer) */}
      <footer className="w-full border-t border-[var(--border-hairline)] bg-[var(--bg-inset)] py-6 px-4 sm:px-8 text-xs font-mono text-[var(--text-secondary)] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 StudyGroup+ • Collaborative Study Workspace</p>
          <div className="flex items-center gap-4">
            <Link href="/lounges" className="hover:text-[var(--text-primary)] transition-colors">
              Study Groups
            </Link>
            <span>•</span>
            <Link href="/profile" className="hover:text-[var(--text-primary)] transition-colors">
              Profile
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
              Home
            </Link>
            <span>•</span>
            <a href="#" className="hover:text-[var(--text-primary)] transition-colors">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>

      {/* Create / Join Study Group Modal */}
      <CreateLoungeModal
        isOpen={isModalOpen}
        initialTab={modalTab}
        onClose={() => setIsModalOpen(false)}
        onLoungeCreated={(newId) => {
          fetchGroups();
          router.push(`/lounges/${newId}`);
        }}
      />
    </RouteTransition>
  );
}
