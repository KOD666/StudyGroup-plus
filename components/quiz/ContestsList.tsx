"use client";

import React from "react";
import {
  Trophy,
  Calendar,
  Clock,
  Play,
  CheckCircle2,
  Users,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ContestItem } from "./types";

interface ContestsListProps {
  contests: ContestItem[];
  isLoading: boolean;
  onStartContest: (contest: ContestItem) => void;
  onViewLeaderboard: (contest: ContestItem) => void;
  onScheduleNew: () => void;
}

function getContestState(contest: ContestItem) {
  const now = Date.now();
  const start = new Date(contest.startTime).getTime();
  const end = start + contest.durationMinutes * 60 * 1000;

  if (now < start) {
    const diffMin = Math.ceil((start - now) / 60000);
    return {
      status: "upcoming" as const,
      label: `Starts in ${diffMin}m`,
      variant: "neutral" as const,
    };
  }
  if (now >= start && now < end) {
    const remainingMin = Math.ceil((end - now) / 60000);
    return {
      status: "active" as const,
      label: `Live now (${remainingMin}m left)`,
      variant: "ochre" as const,
    };
  }
  return {
    status: "ended" as const,
    label: "Ended",
    variant: "subtle" as const,
  };
}

export function ContestsList({
  contests,
  isLoading,
  onStartContest,
  onViewLeaderboard,
  onScheduleNew,
}: ContestsListProps) {
  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-[var(--text-secondary)] font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[var(--border-hairline)] border-t-[var(--text-primary)] rounded-full animate-spin mb-3" />
        <span>Loading contests...</span>
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="p-12 text-center bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)]">
        <Trophy className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-50" />
        <h4 className="font-serif text-lg font-normal text-[var(--text-primary)] mb-1">
          No Contests Scheduled
        </h4>
        <p className="font-sans text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
          Challenge your study group with a timed contest window and real-time leaderboard.
        </p>
        <Button variant="primary" size="sm" onClick={onScheduleNew}>
          Schedule First Contest
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contests.map((contest) => {
        const state = getContestState(contest);
        const hasSubmitted = !!contest.userAttempt?.submittedAt;
        const hasStarted = !!contest.userAttempt?.startedAt;

        return (
          <div
            key={contest.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[var(--radius-card)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] transition-colors gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={state.variant}>{state.label}</Badge>

                {hasSubmitted && (
                  <Badge variant="ochre">
                    <CheckCircle2 className="w-3 h-3 text-[#d97706]" />
                    <span>Submitted (Score: {contest.userAttempt?.score})</span>
                  </Badge>
                )}
              </div>

              <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                {contest.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)] font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(contest.startTime).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {contest.durationMinutes} mins
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {contest.participantCount} joined
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={<Award className="w-3.5 h-3.5" />}
                onClick={() => onViewLeaderboard(contest)}
              >
                Leaderboard
              </Button>

              {state.status === "active" && !hasSubmitted && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play className="w-3.5 h-3.5" />}
                  onClick={() => onStartContest(contest)}
                >
                  {hasStarted ? "Resume Contest" : "Start Contest"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
