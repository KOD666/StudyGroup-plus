"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  FileCode,
  Presentation,
  MessageSquare,
  File,
  Eye,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { LoungeFileItem } from "./types";

interface FilesTableProps {
  groupId: string;
  files: LoungeFileItem[];
  isLoading: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
}

function getFileTypeBadge(fileType: string) {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return { label: "PDF", icon: FileText, variant: "neutral" as const };
    case "md":
      return { label: "Notes", icon: FileCode, variant: "neutral" as const };
    case "pptx":
      return { label: "Deck", icon: Presentation, variant: "neutral" as const };
    case "transcript":
      return {
        label: "Session",
        icon: MessageSquare,
        variant: "ochre" as const,
      };
    default:
      return { label: "File", icon: File, variant: "neutral" as const };
  }
}

export function FilesTable({ groupId, files, isLoading }: FilesTableProps) {
  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-[var(--text-secondary)] font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[var(--border-hairline)] border-t-[var(--text-primary)] rounded-full animate-spin mb-3" />
        <span>Loading lounge files...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-12 text-center bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)]">
        <File className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-50" />
        <h4 className="font-serif text-lg font-normal text-[var(--text-primary)] mb-1">
          No Files Found
        </h4>
        <p className="font-sans text-xs text-[var(--text-secondary)]">
          Try clearing your search query or uploading a new document.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
      <table className="w-full text-left text-xs font-sans border-collapse">
        <thead>
          <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-inset)]/60 text-[var(--text-secondary)] font-mono uppercase tracking-wider text-[0.6875rem]">
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Size</th>
            <th className="py-3 px-4">Uploader</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-hairline)]">
          {files.map((file) => {
            const badge = getFileTypeBadge(file.fileType);
            const BadgeIcon = badge.icon;
            const viewerUrl = `/lounges/${groupId}/folios/${file.id}`;
            const downloadUrl = `/api/assets/${file.id}/download`;

            return (
              <tr
                key={file.id}
                className="hover:bg-[var(--bg-inset)]/40 transition-colors group"
              >
                {/* File Title & Icon */}
                <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                  <Link
                    href={viewerUrl}
                    className="flex items-center gap-2.5 hover:text-[#d97706] transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    <BadgeIcon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[#d97706] transition-colors flex-shrink-0" />
                    <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                      {file.title}
                    </span>
                  </Link>
                </td>

                {/* Type Badge */}
                <td className="py-3.5 px-4">
                  <Badge variant={badge.variant}>
                    {badge.label}
                  </Badge>
                </td>

                {/* Size */}
                <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">
                  {formatBytes(file.sizeBytes)}
                </td>

                {/* Uploader */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-[0.625rem] text-[var(--text-secondary)]">
                      {(file.uploaderName || "U").substring(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[120px] text-[var(--text-secondary)]">
                      {file.uploaderName || "Member"}
                    </span>
                  </div>
                </td>

                {/* Upload Date */}
                <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">
                  {formatDate(file.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <Link
                      href={viewerUrl}
                      title="Open in Document Viewer"
                      className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] transition-colors focus-visible:ring-1 focus-visible:ring-[#d97706]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>

                    <a
                      href={downloadUrl}
                      download
                      title="Download File"
                      className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] transition-colors focus-visible:ring-1 focus-visible:ring-[#d97706]"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
