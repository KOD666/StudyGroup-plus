"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Video,
  FileText,
  Upload,
  Download,
  BookOpen,
  Shield,
  Clock,
  AlertCircle,
  MessageSquare,
  Lock,
  Send,
  Share2,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { UploadAssetModal } from "@/components/lounges/UploadAssetModal";
import { MemberAccessModal } from "@/components/lounges/MemberAccessModal";
import { InviteModal } from "@/components/lounges/InviteModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RouteTransition } from "@/components/motion/RouteTransition";

interface GroupDetails {
  id: string;
  name: string;
  description: string | null;
  code: string;
  creatorId: string;
  createdAt: string;
}

interface Member {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "creator" | "member";
  assetAccess: string[];
  joinedAt: string;
}

interface Asset {
  id: string;
  groupId: string;
  uploaderId: string;
  title: string;
  fileType: "pdf" | "md" | "pptx" | "transcript";
  sizeBytes: number;
  r2Key: string;
  mimeType: string | null;
  createdAt: string;
  canAccess: boolean;
}

interface SessionRecord {
  id: string;
  roomName: string;
  startedAt: string;
  endedAt: string | null;
  summary: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  createdAt: string;
}

interface ActiveSessionData {
  id: string;
  groupId: string;
  roomName: string;
  startedAt: string;
}

export default function LoungeWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const groupId = params.groupId as string;
  const shouldReduceMotion = useReducedMotion();

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [callerRole, setCallerRole] = useState<"creator" | "member">("member");
  const [members, setMembers] = useState<Member[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sessionsList, setSessionsList] = useState<SessionRecord[]>([]);
  const [filterType, setFilterType] = useState<string>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingVideo, setIsStartingVideo] = useState(false);
  const [shakingAssetId, setShakingAssetId] = useState<string | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);

  const fetchWorkspaceData = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);

    try {
      const groupRes = await fetch(`/api/groups/${groupId}`);
      if (!groupRes.ok) {
        const data = await groupRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load study group");
      }
      const groupData = await groupRes.json();
      setGroup(groupData.group);
      setCallerRole(groupData.callerRole);
      setMembers(groupData.members || []);

      const assetsRes = await fetch(`/api/assets?groupId=${groupId}`);
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData.assets || []);
      }

      const sessionsRes = await fetch(`/api/groups/${groupId}/sessions`);
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessionsList(sessionsData.sessions || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  const fetchMessages = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.warn("Could not fetch messages:", err);
    }
  }, [groupId]);

  const fetchActiveSession = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}/sessions/active`);
      if (res.ok) {
        const data = await res.json();
        if (data.active && data.session) {
          setActiveSession(data.session);
        } else {
          setActiveSession(null);
        }
      }
    } catch (err) {
      console.warn("Could not check active session:", err);
    }
  }, [groupId]);

  useEffect(() => {
    fetchWorkspaceData();
    fetchMessages();
    fetchActiveSession();

    // 2.5s real-time polling for group chat and live meeting presence
    const interval = setInterval(() => {
      fetchMessages();
      fetchActiveSession();
    }, 2500);

    return () => clearInterval(interval);
  }, [fetchWorkspaceData, fetchMessages, fetchActiveSession]);

  async function handleStartMeeting() {
    setIsStartingVideo(true);
    try {
      // Start or join the active session record in DB
      await fetch(`/api/groups/${groupId}/sessions/start`, {
        method: "POST",
      });

      router.push(`/lounges/${groupId}/room`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Could not start video meeting");
      setIsStartingVideo(false);
    }
  }

  async function handleDownloadAsset(assetId: string) {
    try {
      const res = await fetch(`/api/assets/${assetId}/download`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get download link");
      }
      const a = document.createElement("a");
      a.href = data.downloadUrl;
      if (data.filename) {
        a.download = data.filename;
      }
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Download failed");
    }
  }

  async function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || isSendingMessage) return;

    setChatInput("");
    setIsSendingMessage(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handlePostInviteToChat(inviteMsg: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inviteMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setChatMessages((prev) => [...prev, data.message]);
        }
      }
    } catch (err) {
      console.error("Failed to post invite message:", err);
    }
  }

  // Restricted document shake trigger (§6.2)
  function handleRestrictedCardClick(assetId: string) {
    setShakingAssetId(assetId);
    setTimeout(() => {
      setShakingAssetId(null);
    }, 250);
  }

  const filteredAssets = assets.filter((asset) => {
    if (filterType === "all") return true;
    if (filterType === "pdf") return asset.fileType === "pdf";
    if (filterType === "md") return asset.fileType === "md";
    if (filterType === "pptx") return asset.fileType === "pptx";
    return true;
  });

  if (isLoading) {
    return (
      <RouteTransition className="bg-[var(--bg-primary)] flex flex-col font-sans min-h-screen text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="h-6 w-1/4 rounded-[var(--radius-button)] skeleton-shimmer" />
          <div className="h-12 w-1/2 rounded-[var(--radius-button)] skeleton-shimmer" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-96 rounded-[var(--radius-card)] skeleton-shimmer" />
            <div className="lg:col-span-4 h-96 rounded-[var(--radius-card)] skeleton-shimmer" />
          </div>
        </main>
      </RouteTransition>
    );
  }

  if (error || !group) {
    return (
      <RouteTransition className="bg-[var(--bg-primary)] flex flex-col font-sans min-h-screen text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-2">
            Study Group Notice
          </h2>
          <p className="font-sans text-xs text-[var(--text-secondary)] mb-6">
            {error || "The requested study group could not be found."}
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/lounges">
              <Button variant="secondary" size="md">
                Back to Study Groups
              </Button>
            </Link>
            <Button variant="primary" size="md" onClick={fetchWorkspaceData}>
              Try Again
            </Button>
          </div>
        </main>
      </RouteTransition>
    );
  }

  const isCreator = callerRole === "creator";

  return (
    <RouteTransition className="bg-[var(--bg-primary)] flex flex-col font-sans min-h-screen text-[var(--text-primary)] selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)]">
      <AppHeader />

      <main
        data-inertia-scroll
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10"
      >
        {/* Top Breadcrumb & Status Sub-header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)] mb-6 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <Link href="/lounges" className="hover:text-[var(--text-primary)] transition-colors">
              Study Groups
            </Link>
            <span className="text-[var(--text-disabled)]">/</span>
            <span className="text-[var(--text-primary)] font-medium">{group.name}</span>
            <span className="text-[var(--text-disabled)]">•</span>
            <span className="font-mono text-[var(--text-secondary)]">Invite Code: #{group.code}</span>
          </div>

          <div className="flex items-center gap-4">
            {activeSession ? (
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-[#e5484d] animate-live-breathe" />
                <span className="text-[#e5484d] font-semibold">Live meeting in progress</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-disabled)]" />
                <span>Meeting room idle</span>
              </div>
            )}

            {/* "Join Live Meeting" vs "Start Video Meeting" */}
            <button
              type="button"
              data-magnetic
              disabled={isStartingVideo}
              onClick={handleStartMeeting}
              className={`magnetic-cta px-4 py-2 rounded-[var(--radius-button)] font-sans text-xs font-semibold uppercase tracking-[0.04em] active:scale-[0.97] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out-quart)] shadow-none flex items-center gap-2 cursor-pointer disabled:opacity-70 ${
                activeSession
                  ? "bg-[#e5484d] text-white hover:bg-[#d63b40]"
                  : "bg-[var(--invert-bg)] text-[var(--invert-text)] hover:bg-white"
              }`}
            >
              {isStartingVideo ? (
                <span className="inline-flex items-center gap-1 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-busy-dot-1" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-busy-dot-2" />
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-busy-dot-3" />
                </span>
              ) : activeSession ? (
                <>
                  <Video className="w-3.5 h-3.5" />
                  Join Live Meeting
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  Start Video Meeting
                </>
              )}
            </button>
          </div>
        </div>

        {/* Group Title Row & Member Presence Strip */}
        <div className="pb-8 border-b border-[var(--border-hairline)] mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-normal text-[var(--text-primary)] mb-3">
            {group.name}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Member Avatars */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 5).map((m) => (
                  <div
                    key={m.userId}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--bg-elevated)] text-[0.6875rem] font-mono font-semibold text-[var(--text-primary)] ring-2 ring-[var(--bg-primary)] border border-[var(--border-hairline)]"
                    title={`${m.name} (${m.role})`}
                  >
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>

              <span className="text-xs text-[var(--text-secondary)] font-sans">
                <strong className="text-[var(--text-primary)] font-medium">{members.length} members</strong>{" "}
                in group: {members.map((m) => m.name.split(" ")[0]).join(", ")}
              </span>
            </div>

            {/* Actions: Invite & Access */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Share2 className="w-3.5 h-3.5" />}
                onClick={() => setIsInviteOpen(true)}
              >
                Invite
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Shield className="w-3.5 h-3.5" />}
                onClick={() => setIsAccessModalOpen(true)}
              >
                {isCreator ? "Manage Access" : "View Members"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Group Documents & Notes */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
                  Group Documents &amp; Notes
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
                  Shared notes, PDFs, and slide decks for this study group.
                </p>
              </div>

              {/* Filter Tabs (§5, §6.2): Animated active pill + sequential cross-fade */}
              <div className="flex items-center gap-1 p-1 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)] text-xs font-mono">
                {[
                  { key: "all", label: `All (${assets.length})` },
                  { key: "md", label: "Notes" },
                  { key: "pdf", label: "PDFs" },
                  { key: "pptx", label: "Decks" },
                ].map((tab) => {
                  const isActive = filterType === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilterType(tab.key)}
                      className={`relative px-3 py-1 rounded-[calc(var(--radius-button)-2px)] transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                        isActive
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeWorkspaceTab"
                          transition={{
                            duration: shouldReduceMotion ? 0.1 : 0.3,
                            ease: [0.25, 1, 0.5, 1],
                          }}
                          className="absolute inset-0 rounded-[calc(var(--radius-button)-2px)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)]"
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assets List: Sequential Cross-fade (§6.2 - 150ms out, then 150ms in via mode="wait") */}
            <AnimatePresence mode="wait">
              <motion.div
                key={filterType}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0.05 : 0.15 }}
                className="space-y-4"
              >
                {filteredAssets.length === 0 ? (
                  <div className="p-8 text-center bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)]">
                    <FileText className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-60" />
                    <h4 className="font-serif text-base font-normal text-[var(--text-primary)] mb-1">
                      No Documents Uploaded Yet
                    </h4>
                    <p className="font-sans text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
                      Upload shared notes, reading lists, or PDFs using the upload area below.
                    </p>
                    <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                      Upload First Document
                    </Button>
                  </div>
                ) : (
                  filteredAssets.map((asset) => {
                    const isPdf = asset.fileType === "pdf";
                    const isMd = asset.fileType === "md";
                    const badgeText = isPdf
                      ? "PDF DOCUMENT"
                      : isMd
                      ? "NOTES"
                      : "SLIDE DECK";

                    const isLocked = !asset.canAccess;
                    const isShaking = shakingAssetId === asset.id;

                    return (
                      <Card
                        key={asset.id}
                        variant="elevated"
                        onClick={() => {
                          if (isLocked) handleRestrictedCardClick(asset.id);
                        }}
                        className={`group transition-all duration-[var(--dur-fast)] overflow-hidden ${
                          isLocked ? "cursor-not-allowed" : ""
                        }`}
                      >
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="neutral">{badgeText}</Badge>
                              <span className="font-mono text-xs text-[var(--text-secondary)]">
                                {(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB • Added{" "}
                                {new Date(asset.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Restricted document lock with shake feedback (§6.2) */}
                            {isLocked && (
                              <span
                                className={`font-mono text-xs text-[var(--text-secondary)] flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] ${
                                  isShaking ? "animate-restricted-shake" : ""
                                }`}
                              >
                                <Lock
                                  className={`w-3.5 h-3.5 text-[var(--text-primary)] ${
                                    isShaking ? "animate-restricted-shake" : ""
                                  }`}
                                />
                                Restricted Access
                              </span>
                            )}
                          </div>

                          <h3 className="font-serif text-lg sm:text-xl font-normal text-[var(--text-primary)] group-hover:underline transition-colors mb-2">
                            {asset.title}
                          </h3>

                          {/* Actions */}
                          <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between gap-4">
                            <div className="font-mono text-[0.6875rem] text-[var(--text-secondary)] truncate max-w-xs">
                              Key: {asset.r2Key.substring(0, 20)}...
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<Download className="w-3.5 h-3.5" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadAsset(asset.id);
                                }}
                              >
                                Download
                              </Button>
                              {asset.canAccess ? (
                                <Link href={`/lounges/${groupId}/folios/${asset.id}`}>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    icon={<BookOpen className="w-3.5 h-3.5" />}
                                  >
                                    Open Document
                                  </Button>
                                </Link>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRestrictedCardClick(asset.id);
                                  }}
                                >
                                  Access Restricted
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>

            {/* Dropzone Upload Area */}
            <div
              onClick={() => setIsUploadOpen(true)}
              className="p-8 border border-dashed border-[var(--border-hairline)] hover:border-[var(--border-hover)] bg-[var(--bg-elevated)] rounded-[var(--radius-card)] text-center cursor-pointer transition-colors duration-[var(--dur-fast)]"
            >
              <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-secondary)] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-4 h-4" />
              </div>
              <h4 className="font-serif text-base font-normal text-[var(--text-primary)] mb-1">
                Upload Study Materials
              </h4>
              <p className="font-sans text-xs text-[var(--text-secondary)] max-w-md mx-auto mb-4">
                Upload PDF, Markdown notes, or slide decks to share with your group
              </p>
              <Button variant="secondary" size="sm" onClick={() => setIsUploadOpen(true)}>
                Select Files to Upload
              </Button>
            </div>
          </div>

          {/* Right Column (4 cols): Study Stream & Session Logs */}
          <div className="lg:col-span-4 space-y-6">
            {/* Session Record Card */}
            <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)] mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <h4 className="font-serif text-sm font-normal text-[var(--text-primary)]">
                    Past Meetings
                  </h4>
                </div>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                  History
                </span>
              </div>

              {sessionsList.length > 0 && sessionsList[0] ? (
                <div className="space-y-3 font-sans text-xs">
                  <div className="p-3 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)]">
                    <div className="flex items-center justify-between text-[var(--text-secondary)] font-mono text-[0.6875rem] mb-1">
                      <span>Previous Meeting</span>
                      <span className="text-[var(--text-primary)]">Concluded</span>
                    </div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">
                      {sessionsList[0]?.roomName}
                    </p>
                    {sessionsList[0]?.summary && (
                      <p className="font-serif italic text-xs text-[var(--text-secondary)] mt-1 border-t border-[var(--border-hairline)] pt-1">
                        Summary: {sessionsList[0]?.summary}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 font-mono text-xs text-[var(--text-secondary)]">
                  <p>No past meetings recorded for this group yet.</p>
                </div>
              )}
            </div>

            {/* Synchronous Chat Stream (§6.2 Native scroll, 8px rise+fade, own messages right) */}
            <div className="bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] flex flex-col overflow-hidden">
              <div className="px-5 py-3.5 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <h4 className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--text-primary)]">
                    Group Chat
                  </h4>
                </div>
                <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
                  {members.length} Online
                </span>
              </div>

              {/* Message List: Native momentum scroll, 8px rise+fade */}
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto font-sans text-xs">
                {chatMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--text-secondary)] font-mono">
                    No messages in this study group yet. Say hello to your peers!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf =
                      msg.senderName === (user?.fullName || user?.firstName) ||
                      members.some(
                        (m) =>
                          m.userId === msg.senderId &&
                          m.email === user?.primaryEmailAddress?.emailAddress
                      );
                    const time = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <motion.div
                        key={msg.id}
                        initial={
                          shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: shouldReduceMotion ? 0.1 : 0.2,
                          ease: [0.25, 1, 0.5, 1],
                        }}
                        className={`flex flex-col space-y-1 ${
                          isSelf ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-baseline gap-2 text-[0.625rem] font-mono text-[var(--text-secondary)]">
                          <span className="font-medium text-[var(--text-primary)]">
                            {isSelf ? "You" : msg.senderName}
                          </span>
                          <span>{time}</span>
                        </div>
                        <div
                          className={`p-2.5 rounded-[var(--radius-button)] text-xs max-w-[85%] leading-relaxed ${
                            isSelf
                              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] font-sans"
                              : "bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--border-hairline)] font-sans"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendChatMessage}
                className="p-3 border-t border-[var(--border-hairline)] bg-[var(--bg-inset)] flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors duration-[var(--dur-fast)]"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="p-2 bg-[var(--invert-bg)] hover:bg-white text-[var(--invert-text)] rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <UploadAssetModal
        groupId={groupId}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAssetUploaded={fetchWorkspaceData}
      />

      {/* Member Access Modal */}
      <MemberAccessModal
        groupId={groupId}
        isCreator={isCreator}
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        members={members}
        assets={assets}
        onAccessUpdated={fetchWorkspaceData}
      />

      {/* Invite Modal */}
      <InviteModal
        groupName={group.name}
        groupCode={group.code}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onPostToChat={handlePostInviteToChat}
      />
    </RouteTransition>
  );
}
