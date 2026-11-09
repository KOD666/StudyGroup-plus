"use client";

import React from "react";
import {
  Play,
  FileText,
  Sparkles,
  UploadCloud,
  Edit,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuestionSetItem } from "./types";

interface QuestionSetsListProps {
  sets: QuestionSetItem[];
  isLoading: boolean;
  currentUserId?: string;
  isLoungeOwner: boolean;
  onPractice: (set: QuestionSetItem) => void;
  onEdit: (set: QuestionSetItem) => void;
  onDelete: (setId: string) => void;
  onCreateNew: () => void;
}

function getSourceBadge(source: QuestionSetItem["source"]) {
  switch (source) {
    case "ai":
      return { label: "AI Draft", icon: Sparkles, variant: "ochre" as const };
    case "import":
      return {
        label: "Imported",
        icon: UploadCloud,
        variant: "neutral" as const,
      };
    default:
      return { label: "Manual", icon: FileText, variant: "neutral" as const };
  }
}

export function QuestionSetsList({
  sets,
  isLoading,
  currentUserId,
  isLoungeOwner,
  onPractice,
  onEdit,
  onDelete,
  onCreateNew,
}: QuestionSetsListProps) {
  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-[var(--text-secondary)] font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[var(--border-hairline)] border-t-[var(--text-primary)] rounded-full animate-spin mb-3" />
        <span>Loading question sets...</span>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="p-12 text-center bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)]">
        <FileText className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-50" />
        <h4 className="font-serif text-lg font-normal text-[var(--text-primary)] mb-1">
          No Question Sets Yet
        </h4>
        <p className="font-sans text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
          Create questions manually, bulk import from CSV/JSON, or draft questions with AI from lounge notes.
        </p>
        <Button variant="primary" size="sm" onClick={onCreateNew}>
          Create First Question Set
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sets.map((set) => {
        const sourceBadge = getSourceBadge(set.source);
        const SourceIcon = sourceBadge.icon;
        const isAuthor = currentUserId === set.creatorId;
        const canManage = isAuthor || isLoungeOwner;
        const isDraft = set.status === "draft";

        return (
          <div
            key={set.id}
            className="flex flex-col justify-between p-5 rounded-[var(--radius-card)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={sourceBadge.variant}>
                    <SourceIcon className="w-3 h-3" />
                    <span>{sourceBadge.label}</span>
                  </Badge>

                  {isDraft ? (
                    <Badge variant="ochre">
                      <Lock className="w-3 h-3" />
                      <span>Draft</span>
                    </Badge>
                  ) : (
                    <Badge variant="neutral">
                      <Globe className="w-3 h-3" />
                      <span>Published</span>
                    </Badge>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Edit set metadata"
                      onClick={() => onEdit(set)}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] hover:bg-[var(--bg-inset)] cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete set"
                      onClick={() => onDelete(set.id)}
                      className="p-1 text-[var(--text-secondary)] hover:text-[#e5484d] rounded-[var(--radius-button)] hover:bg-[var(--bg-inset)] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-serif text-lg font-normal text-[var(--text-primary)] mb-1">
                {set.title}
              </h3>

              {set.description && (
                <p className="font-sans text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">
                  {set.description}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono">
                <span>{set.questionCount} Questions</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">
                  by {set.creatorName || "Member"}
                </span>
              </div>

              {isDraft ? (
                canManage ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Edit className="w-3 h-3" />}
                    onClick={() => onEdit(set)}
                  >
                    Review &amp; Publish
                  </Button>
                ) : null
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play className="w-3 h-3" />}
                  onClick={() => onPractice(set)}
                >
                  Practice
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
