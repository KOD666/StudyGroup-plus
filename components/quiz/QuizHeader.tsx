"use client";

import React from "react";
import { Plus, Upload, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QuizHeaderProps {
  activeTab: "sets" | "contests" | "leaderboard";
  onTabChange: (tab: "sets" | "contests" | "leaderboard") => void;
  setsCount: number;
  contestsCount: number;
  onOpenAiDraft: () => void;
  onOpenImport: () => void;
  onOpenSchedule: () => void;
  onOpenCreate: () => void;
}

export function QuizHeader({
  activeTab,
  onTabChange,
  setsCount,
  contestsCount,
  onOpenAiDraft,
  onOpenImport,
  onOpenSchedule,
  onOpenCreate,
}: QuizHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
            Quizzes
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-sans mt-1">
            Question sets, solo practice, timed group contests, and leaderboards.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5 text-[#d97706]" />}
            onClick={onOpenAiDraft}
          >
            Draft with AI
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={onOpenImport}
          >
            Bulk Import
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Calendar className="w-3.5 h-3.5 text-[#d97706]" />}
            onClick={onOpenSchedule}
          >
            Schedule Contest
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={onOpenCreate}
          >
            Create Set
          </Button>
        </div>
      </div>

      {/* Sub Tabs: Question Sets, Contests, Leaderboard */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)] w-fit text-xs font-mono">
        <button
          type="button"
          onClick={() => onTabChange("sets")}
          className={`px-3 py-1.5 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
            activeTab === "sets"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Question Sets ({setsCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange("contests")}
          className={`px-3 py-1.5 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
            activeTab === "contests"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Contests ({contestsCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange("leaderboard")}
          className={`px-3 py-1.5 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Leaderboard
        </button>
      </div>
    </div>
  );
}
