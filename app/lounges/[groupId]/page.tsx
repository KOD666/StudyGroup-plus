"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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

export default function LoungeWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [callerRole, setCallerRole] = useState<"creator" | "member">("member");
  const [members, setMembers] = useState<Member[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sessionsList, setSessionsList] = useState<SessionRecord[]>([]);
  const [filterType, setFilterType] = useState<string>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingVideo, setIsStartingVideo] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "Elena Vance",
      text: "Has anyone started on the Chapter 3 summary questions yet?",
      time: "11:04 AM",
    },
    {
      sender: "Julian Thorne",
      text: "Yes, I uploaded the initial notes to the documents section above.",
      time: "11:12 AM",
    },
  ]);

  const fetchWorkspaceData = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch group details and members
      const groupRes = await fetch(`/api/groups/${groupId}`);
      if (!groupRes.ok) {
        const data = await groupRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load study group");
      }
      const groupData = await groupRes.json();
      setGroup(groupData.group);
      setCallerRole(groupData.callerRole);
      setMembers(groupData.members || []);

      // 2. Fetch assets
      const assetsRes = await fetch(`/api/assets?groupId=${groupId}`);
      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        setAssets(assetsData.assets || []);
      }

      // 3. Fetch sessions
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

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  async function handleStartMeeting() {
    setIsStartingVideo(true);
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to connect to video meeting");
      }

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

  function handleSendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [
      ...prev,
      {
        sender: user?.firstName || user?.fullName || "Member",
        text: chatInput.trim(),
        time: timeStr,
      },
    ]);
    setChatInput("");
  }

  function handlePostInviteToChat(inviteMsg: string) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [
      ...prev,
      {
        sender: user?.firstName || user?.fullName || "You",
        text: inviteMsg,
        time: timeStr,
      },
    ]);
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
      <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans">
        <AppHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-8">
          <div className="h-6 bg-[#e5e2d9]/60 rounded w-1/4" />
          <div className="h-12 bg-[#e5e2d9]/80 rounded w-1/2" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 h-96 bg-[#e5e2d9]/40 rounded" />
            <div className="lg:col-span-4 h-96 bg-[#e5e2d9]/40 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans">
        <AppHeader />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-[#ba5d1a] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#171615] mb-2">
            Study Group Notice
          </h2>
          <p className="text-sm text-[#5e5a54] mb-6">
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
      </div>
    );
  }

  const isCreator = callerRole === "creator";

  return (
    <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans selection:bg-[#ffdbc9] selection:text-[#171615]">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Breadcrumb & Status Sub-header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e5e2d9] mb-6 text-xs text-[#78746d]">
          <div className="flex items-center gap-2">
            <Link href="/lounges" className="hover:text-[#171615] transition-colors duration-150">
              Study Groups
            </Link>
            <span>/</span>
            <span className="text-[#171615] font-medium">{group.name}</span>
            <span>•</span>
            <span className="font-mono text-[#78746d]">Invite Code: #{group.code}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-[#234338] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#234338] animate-pulse" />
              <span>Meeting room ready</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Video className="w-4 h-4" />}
              isLoading={isStartingVideo}
              onClick={handleStartMeeting}
            >
              Start Video Meeting
            </Button>
          </div>
        </div>

        {/* Group Title Row & Member Presence Strip */}
        <div className="pb-8 border-b border-[#e5e2d9] mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight font-normal text-[#171615] mb-3">
            {group.name}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Member Avatars */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2 overflow-hidden">
                {members.slice(0, 5).map((m) => (
                  <div
                    key={m.userId}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#234338] text-[0.6875rem] font-bold text-[#faf9f6] ring-2 ring-[#fdf8f6]"
                    title={`${m.name} (${m.role})`}
                  >
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>

              <span className="text-xs text-[#5e5a54]">
                <strong className="text-[#171615] font-semibold">{members.length} members</strong>{" "}
                in group: {members.map((m) => m.name.split(" ")[0]).join(", ")}
              </span>
            </div>

            {/* Actions: Invite & Access */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Share2 className="w-3.5 h-3.5 text-[#ba5d1a]" />}
                onClick={() => setIsInviteOpen(true)}
              >
                Invite
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Shield className="w-3.5 h-3.5 text-[#ba5d1a]" />}
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
                <h2 className="font-serif text-2xl font-normal text-[#171615]">
                  Group Documents &amp; Notes
                </h2>
                <p className="text-xs text-[#78746d] font-sans mt-0.5">
                  Shared notes, PDFs, and slide decks for this study group.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#f4f2eb] rounded-[0.25rem] border border-[#e5e2d9] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`px-2.5 py-1 rounded-[0.125rem] transition-colors duration-150 ${
                    filterType === "all"
                      ? "bg-[#ffffff] text-[#171615] shadow-xs"
                      : "text-[#5e5a54] hover:text-[#171615]"
                  }`}
                >
                  All ({assets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("md")}
                  className={`px-2.5 py-1 rounded-[0.125rem] transition-colors duration-150 ${
                    filterType === "md"
                      ? "bg-[#ffffff] text-[#171615] shadow-xs"
                      : "text-[#5e5a54] hover:text-[#171615]"
                  }`}
                >
                  Notes
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("pdf")}
                  className={`px-2.5 py-1 rounded-[0.125rem] transition-colors duration-150 ${
                    filterType === "pdf"
                      ? "bg-[#ffffff] text-[#171615] shadow-xs"
                      : "text-[#5e5a54] hover:text-[#171615]"
                  }`}
                >
                  PDFs
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType("pptx")}
                  className={`px-2.5 py-1 rounded-[0.125rem] transition-colors duration-150 ${
                    filterType === "pptx"
                      ? "bg-[#ffffff] text-[#171615] shadow-xs"
                      : "text-[#5e5a54] hover:text-[#171615]"
                  }`}
                >
                  Decks
                </button>
              </div>
            </div>

            {/* Assets List */}
            {filteredAssets.length === 0 ? (
              <div className="p-8 text-center bg-[#ffffff] rounded-[0.25rem] border border-dashed border-[#ddd8cc]">
                <FileText className="w-8 h-8 text-[#ba5d1a] mx-auto mb-2 opacity-60" />
                <h4 className="font-serif text-base text-[#171615] mb-1">
                  No Documents Uploaded Yet
                </h4>
                <p className="text-xs text-[#5e5a54] max-w-sm mx-auto mb-4">
                  Upload shared notes, reading lists, or PDFs using the upload area below.
                </p>
                <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                  Upload First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssets.map((asset) => {
                  const isPdf = asset.fileType === "pdf";
                  const isMd = asset.fileType === "md";
                  const badgeVariant = isPdf ? "forest" : isMd ? "ochre" : "neutral";
                  const badgeText = isPdf
                    ? "PDF DOCUMENT"
                    : isMd
                    ? "NOTES"
                    : "SLIDE DECK";

                  return (
                    <Card
                      key={asset.id}
                      variant="ivory"
                      className="group hover:border-[#ddd8cc] hover:-translate-y-0.5 hover:shadow-paper-floating transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={badgeVariant}>{badgeText}</Badge>
                            <span className="text-xs text-[#78746d] font-sans">
                              {(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB • Added{" "}
                              {new Date(asset.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {!asset.canAccess && (
                            <span className="text-xs text-[#ba1a1a] font-medium flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" /> Restricted Access
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-lg sm:text-xl font-normal text-[#171615] group-hover:text-[#ba5d1a] transition-colors duration-150 mb-2">
                          {asset.title}
                        </h3>

                        {/* Actions */}
                        <div className="pt-4 border-t border-[#e5e2d9] flex items-center justify-between gap-4">
                          <div className="text-xs text-[#78746d] font-editorial italic">
                            File: {asset.r2Key.substring(0, 16)}...
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Download className="w-3.5 h-3.5" />}
                              onClick={() => handleDownloadAsset(asset.id)}
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
                              <Button variant="secondary" size="sm" disabled>
                                Access Restricted
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Dropzone Upload Area */}
            <div
              onClick={() => setIsUploadOpen(true)}
              className="p-8 border-2 border-dashed border-[#ddd8cc] hover:border-[#ba5d1a] bg-[#faf9f6]/70 rounded-[0.25rem] text-center cursor-pointer transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-[0.25rem] bg-[#ffffff] border border-[#ddd8cc] text-[#ba5d1a] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-base text-[#171615] mb-1">
                Upload Study Materials
              </h4>
              <p className="text-xs text-[#5e5a54] max-w-md mx-auto mb-4">
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
            <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] p-5 shadow-paper-contact hover:shadow-paper-floating transition-all duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#e5e2d9] mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#ba5d1a]" />
                  <h4 className="font-serif text-sm font-normal text-[#171615]">
                    Past Meetings
                  </h4>
                </div>
                <span className="font-sans text-[0.625rem] uppercase tracking-[0.08em] text-[#78746d]">
                  History
                </span>
              </div>

              {sessionsList.length > 0 && sessionsList[0] ? (
                <div className="space-y-3 text-xs font-sans">
                  <div className="p-3 bg-[#faf9f6] rounded-[0.25rem] border border-[#e5e2d9]">
                    <div className="flex items-center justify-between text-[#78746d] mb-1">
                      <span>Previous Meeting</span>
                      <span className="text-[#234338] font-medium">Ended</span>
                    </div>
                    <p className="font-medium text-[#171615] mb-1">
                      {sessionsList[0]?.roomName}
                    </p>
                    {sessionsList[0]?.summary && (
                      <p className="font-editorial italic text-xs text-[#5e5a54] mt-1 border-t border-[#e5e2d9]/60 pt-1">
                        Summary: {sessionsList[0]?.summary}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-[#78746d]">
                  <p>No past meetings recorded for this group yet.</p>
                </div>
              )}
            </div>

            {/* Synchronous Chat Stream */}
            <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] flex flex-col shadow-paper-contact hover:shadow-paper-floating transition-all duration-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-[#faf9f6] border-b border-[#e5e2d9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#234338]" />
                  <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#171615]">
                    Group Chat
                  </h4>
                </div>
                <span className="font-sans text-[0.625rem] text-[#234338] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#234338] animate-pulse" />
                  {members.length} Online
                </span>
              </div>

              {/* Message List */}
              <div className="p-4 space-y-3.5 max-h-80 overflow-y-auto font-sans text-xs">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-baseline justify-between text-[0.625rem] text-[#78746d]">
                      <span className="font-semibold text-[#171615]">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="font-editorial text-[0.8125rem] leading-relaxed text-[#171615] bg-[#fdf8f6] p-2.5 rounded-[0.25rem] border border-[#e5e2d9]">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendChatMessage}
                className="p-3 border-t border-[#e5e2d9] bg-[#faf9f6]/40 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] text-xs px-3 py-2 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] transition-colors duration-150"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="p-2 bg-[#ba5d1a] hover:bg-[#a24e14] text-[#faf9f6] rounded-[0.25rem] transition-colors duration-150 shrink-0"
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
    </div>
  );
}
