"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Medal } from "lucide-react";
import { LoungeStandingEntry } from "./types";

interface LoungeLeaderboardViewProps {
  groupId: string;
}

export function LoungeLeaderboardView({ groupId }: LoungeLeaderboardViewProps) {
  const [range, setRange] = useState<"week" | "all">("week");
  const [standings, setStandings] = useState<LoungeStandingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStandings = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/quizzes/leaderboard?range=${range}`
      );
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || []);
      }
    } catch (err) {
      console.error("Failed to fetch lounge leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, range]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  return (
    <div className="space-y-4">
      {/* Tab filter: This Week vs All Time */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs text-[var(--text-secondary)]">
          Points earned exclusively from competitive contests in this lounge.
        </p>

        <div className="flex items-center gap-1 p-0.5 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)] text-xs font-mono">
          <button
            type="button"
            onClick={() => setRange("week")}
            className={`px-3 py-1 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
              range === "week"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setRange("all")}
            className={`px-3 py-1 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
              range === "all"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-[var(--text-secondary)] font-mono text-xs">
          <div className="w-6 h-6 border-2 border-[var(--border-hairline)] border-t-[var(--text-primary)] rounded-full animate-spin mb-3" />
          <span>Loading leaderboard...</span>
        </div>
      ) : standings.length === 0 ? (
        <div className="p-12 text-center bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)]">
          <Medal className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-50" />
          <h4 className="font-serif text-lg font-normal text-[var(--text-primary)] mb-1">
            No Contest Points Yet
          </h4>
          <p className="font-sans text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Points are earned by participating in timed contests. Schedule or join a contest to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-inset)]/60 text-[var(--text-secondary)] font-mono uppercase text-[0.6875rem]">
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-center">Contests</th>
                <th className="py-3 px-4 text-right">Total Time</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-hairline)]">
              {standings.map((entry) => (
                <tr
                  key={entry.userId}
                  className={`hover:bg-[var(--bg-inset)]/30 transition-colors ${
                    entry.isCurrentUser ? "bg-[#d97706]/10 font-medium" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-center font-mono font-bold">
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-[0.6875rem]">
                        {entry.userName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[200px]">
                        {entry.userName}
                        {entry.isCurrentUser ? " (You)" : ""}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-[var(--text-secondary)]">
                    {entry.contestsPlayed}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                    {entry.totalSeconds}s
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#d97706]">
                    {entry.totalPoints} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
