"use client";

import React, { useState } from "react";
import { X, Trophy, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuestionSetItem } from "./types";

interface ScheduleContestModalProps {
  groupId: string;
  sets: QuestionSetItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleContestModal({
  groupId,
  sets,
  isOpen,
  onClose,
  onSuccess,
}: ScheduleContestModalProps) {
  const publishedSets = sets.filter((s) => s.status === "published");
  const [setId, setSetId] = useState(publishedSets[0]?.id || "");
  const [title, setTitle] = useState("");
  // Default start time: 5 minutes from now in local ISO string for datetime-local input
  const defaultLocalTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
  const [startTimeLocal, setStartTimeLocal] = useState(defaultLocalTime);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a contest title.");
      return;
    }
    if (!setId) {
      setError("Please select a published question set.");
      return;
    }

    const startDate = new Date(startTimeLocal);
    if (isNaN(startDate.getTime())) {
      setError("Please specify a valid start time.");
      return;
    }
    if (startDate.getTime() < Date.now() - 60000) {
      setError("Start time cannot be in the past.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/quizzes/contests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setId,
          title: title.trim(),
          startTime: startDate.toISOString(),
          durationMinutes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule contest");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating contest");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] text-[var(--text-primary)]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#d97706]" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal">
                Schedule a Contest
              </h2>
              <p className="font-sans text-xs text-[var(--text-secondary)] mt-0.5">
                Set a live window where lounge members compete simultaneously.
              </p>
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-[var(--radius-button)] bg-[var(--accent-live-wash)] border border-[var(--accent-live)]/40 text-xs text-[var(--text-primary)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#e5484d] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
              Contest Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Speed Round: Operating Systems"
              className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none"
              maxLength={255}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
              Question Set *
            </label>
            {publishedSets.length === 0 ? (
              <div className="p-3 bg-[var(--bg-inset)] rounded-[var(--radius-card)] text-xs text-[var(--text-secondary)]">
                No published question sets available. Please publish a set first.
              </div>
            ) : (
              <select
                value={setId}
                onChange={(e) => setSetId(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none cursor-pointer"
              >
                {publishedSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.questionCount} questions)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Start Time (Local) *
              </label>
              <input
                type="datetime-local"
                value={startTimeLocal}
                onChange={(e) => setStartTimeLocal(e.target.value)}
                className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Duration (Minutes) *
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none cursor-pointer"
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes (Standard)</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          <p className="text-[0.6875rem] text-[var(--text-secondary)]">
            Times are stored in UTC and displayed in local time. Members will receive a notification in this lounge.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-hairline)]">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || publishedSets.length === 0}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? "Scheduling..." : "Schedule Contest"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
