"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Search,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { LoungeSubNav, MIN_MEMBERS_FOR_FILES } from "@/components/lounge/LoungeSubNav";
import { UploadAssetModal } from "@/components/lounges/UploadAssetModal";
import { InviteModal } from "@/components/lounges/InviteModal";
import { Button } from "@/components/ui/Button";
import { RouteTransition } from "@/components/motion/RouteTransition";
import { useLoungeFiles } from "@/components/files/useLoungeFiles";
import { FilesTable } from "@/components/files/FilesTable";
import { FilesInviteCard } from "@/components/files/FilesInviteCard";
import { FileTypeFilter, FileSortOption } from "@/components/files/types";

interface GroupData {
  id: string;
  name: string;
  code: string;
}

export default function LoungeFilesPage() {
  const params = useParams();
  const groupId = params?.groupId as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isGroupLoading, setIsGroupLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const {
    files,
    pagination,
    isLoading: isFilesLoading,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    page,
    setPage,
    reload,
  } = useLoungeFiles(groupId);

  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
        setMemberCount(data.members?.length || 0);
      }
    } catch (e) {
      console.error("Failed to load lounge metadata:", e);
    } finally {
      setIsGroupLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const filterTabs: { key: FileTypeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pdf", label: "PDFs" },
    { key: "md", label: "Notes" },
    { key: "pptx", label: "Decks" },
    { key: "transcript", label: "Sessions" },
    { key: "other", label: "Other" },
  ];

  return (
    <RouteTransition className="bg-[var(--bg-primary)] flex flex-col font-sans min-h-screen text-[var(--text-primary)]">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 pb-4 text-xs text-[var(--text-secondary)]">
          <Link href="/lounges" className="hover:text-[var(--text-primary)] transition-colors">
            Study Groups
          </Link>
          <span className="text-[var(--text-disabled)]">/</span>
          <Link
            href={`/lounges/${groupId}`}
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            {group?.name || "Lounge"}
          </Link>
          <span className="text-[var(--text-disabled)]">/</span>
          <span className="text-[var(--text-primary)] font-medium">Files</span>
        </div>

        {/* Lounge Sub-Navigation */}
        <LoungeSubNav groupId={groupId} memberCount={memberCount} />

        {isGroupLoading ? (
          <div className="w-full py-20 flex justify-center text-xs text-[var(--text-secondary)] font-mono">
            Loading lounge...
          </div>
        ) : memberCount < MIN_MEMBERS_FOR_FILES ? (
          /* Direct visit to smaller lounge fallback */
          <FilesInviteCard onInvite={() => setIsInviteOpen(true)} />
        ) : (
          <div className="space-y-6">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
                  Files
                </h1>
                <p className="text-xs text-[var(--text-secondary)] font-sans mt-1">
                  Every document, note, slide deck, and session transcript in this lounge.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => setIsUploadOpen(true)}
              >
                Upload File
              </Button>
            </div>

            {/* Controls Bar: Search, Type Filters, Sort */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)]">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files by name..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:border-[#d97706] focus:outline-none transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter Pills */}
                <div className="flex items-center gap-1 p-0.5 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)] text-xs font-mono">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setTypeFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
                        typeFilter === tab.key
                          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium shadow-none"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative flex items-center">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as FileSortOption)}
                    className="pl-8 pr-6 py-1.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none cursor-pointer appearance-none transition-colors"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Files List Table */}
            <FilesTable
              groupId={groupId}
              files={files}
              isLoading={isFilesLoading}
            />

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
                <div>
                  Showing {(page - 1) * pagination.pageSize + 1}–
                  {Math.min(page * pagination.pageSize, pagination.total)} of{" "}
                  {pagination.total} files
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    icon={<ChevronLeft className="w-3 h-3" />}
                  >
                    Previous
                  </Button>
                  <span className="font-mono px-2">
                    {page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    icon={<ChevronRight className="w-3 h-3" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload Asset Modal */}
      {isUploadOpen && (
        <UploadAssetModal
          groupId={groupId}
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onAssetUploaded={() => {
            setIsUploadOpen(false);
            reload();
          }}
        />
      )}

      {/* Invite Modal */}
      {isInviteOpen && group && (
        <InviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          groupCode={group.code}
          groupName={group.name}
          onPostToChat={() => {}}
        />
      )}
    </RouteTransition>
  );
}
