"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Trophy, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ContestLeaderboardEntry, QuestionItem } from "./types";

interface ContestLeaderboardModalProps {
  groupId: string;
  contestId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContestLeaderboardModal({
  groupId,
  contestId,
  isOpen,
  onClose,
}: ContestLeaderboardModalProps) {
  const [contest, setContest] = useState<{
    id: string;
    title: string;
    deadline: string;
  } | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ContestLeaderboardEntry[]>([]);
  const [explanations, setExplanations] = useState<QuestionItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (isPoll = false) => {
    if (!groupId || !contestId) return;
    if (isPoll) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/quizzes/contests/${contestId}/leaderboard`
      );
      if (res.ok) {
        const data = await res.json();
        setContest(data.contest);
        setWindowClosed(data.windowClosed);
        setLeaderboard(data.leaderboard || []);
        if (data.explanations) {
          setExplanations(data.explanations);
        }
      }
    } catch (err) {
      console.error("Failed to load contest leaderboard:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [groupId, contestId]);

  // Polling every 5 seconds, paused when tab is hidden (document.hidden)
  useEffect(() => {
    if (!isOpen) return;

    fetchLeaderboard(false);

    const interval = setInterval(() => {
      if (!document.hidden && !windowClosed) {
        fetchLeaderboard(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, fetchLeaderboard, windowClosed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#d97706]" />
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-normal truncate max-w-md">
                {contest?.title || "Contest Leaderboard"}
              </h2>
              <div className="flex items-center gap-2 font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                <span>{windowClosed ? "Window Closed" : "Live Standings"}</span>
                {!windowClosed && isRefreshing && (
                  <span className="flex items-center gap-1 text-[#d97706]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Updating...</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 flex justify-center text-xs font-mono text-[var(--text-secondary)]">
              Loading standings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center bg-[var(--bg-inset)]/40 rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
              No submissions recorded yet for this contest.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-hairline)]">
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-inset)]/60 text-[var(--text-secondary)] font-mono uppercase text-[0.6875rem]">
                    <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                    <th className="py-2.5 px-3">Participant</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.userId}
                      className={
                        entry.isCurrentUser
                          ? "bg-[#d97706]/10 font-medium"
                          : "hover:bg-[var(--bg-inset)]/30"
                      }
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {entry.rank === 1 ? (
                          <span className="text-[#d97706]">🥇 1</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-gray-300">🥈 2</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-700">🥉 3</span>
                        ) : (
                          entry.rank
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-[0.625rem]">
                            {entry.userName.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[150px]">
                            {entry.userName}
                            {entry.isCurrentUser ? " (You)" : ""}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#d97706]">
                        {entry.score} pts
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[var(--text-secondary)]">
                        {entry.totalSeconds}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Correct Answers and Explanations (Shown only once window closes) */}
          {windowClosed && explanations && explanations.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#d97706]" />
                <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                  Official Solutions &amp; Explanations
                </h4>
              </div>

              {explanations.map((q) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-[var(--radius-card)] bg-[var(--bg-inset)]/40 border border-[var(--border-hairline)] text-xs space-y-2"
                >
                  <p className="font-medium text-[var(--text-primary)]">
                    {q.orderNum}. {q.prompt}
                  </p>
                  <div className="space-y-1 pl-2">
                    {q.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 ${
                          idx === q.correctOption
                            ? "text-[#d97706] font-semibold"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        <span className="font-mono">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span>{opt}</span>
                        {idx === q.correctOption && (
                          <span className="text-[0.625rem] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="p-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[0.6875rem] text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        Explanation:{" "}
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-[var(--border-hairline)]">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
