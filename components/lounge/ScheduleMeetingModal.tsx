"use client";

import React, { useState, useEffect } from "react";
import { Calendar, X, Loader2, AlertCircle } from "lucide-react";

interface ScheduleMeetingModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
  initialSession?: {
    id: string;
    title: string;
    scheduledAt: string;
    description?: string | null;
  } | null;
}

export function ScheduleMeetingModal({
  groupId,
  isOpen,
  onClose,
  onScheduled,
  initialSession,
}: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form fields when opening or editing
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    if (initialSession) {
      setTitle(initialSession.title);
      setDescription(initialSession.description || "");
      const d = new Date(initialSession.scheduledAt);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const mins = String(d.getMinutes()).padStart(2, "0");
      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${mins}`);
    } else {
      setTitle("");
      setDescription("");
      // Default to 1 hour from now
      const future = new Date(Date.now() + 60 * 60 * 1000);
      const year = future.getFullYear();
      const month = String(future.getMonth() + 1).padStart(2, "0");
      const day = String(future.getDate()).padStart(2, "0");
      const hours = String(future.getHours()).padStart(2, "0");
      const mins = "00";
      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${mins}`);
    }
  }, [isOpen, initialSession]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a meeting title");
      return;
    }

    if (!date || !time) {
      setError("Please select both a date and time");
      return;
    }

    const scheduledDateTime = new Date(`${date}T${time}`);
    if (isNaN(scheduledDateTime.getTime())) {
      setError("Invalid date or time selected");
      return;
    }

    if (scheduledDateTime.getTime() <= Date.now()) {
      setError("Scheduled time must be in the future");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = initialSession
        ? `/api/groups/${groupId}/schedule/${initialSession.id}`
        : `/api/groups/${groupId}/schedule`;
      const method = initialSession ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          scheduledAt: scheduledDateTime.toISOString(),
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save scheduled meeting");
      }

      onScheduled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] shadow-2xl p-6 relative font-sans animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-[#d97706]" />
          <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)]">
            {initialSession
              ? "Edit Scheduled Meeting"
              : "Schedule a Study Meeting"}
          </h3>
        </div>
        <p className="font-sans text-xs text-[var(--text-secondary)] mb-5">
          Schedule an upcoming study session for your group members. Times are
          stored in UTC and displayed in each member&apos;s local timezone.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-[var(--radius-button)] bg-[#e5484d]/10 border border-[#e5484d]/20 text-[#e5484d] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase mb-1">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Problem Set Review"
              className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase mb-1">
                Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase mb-1">
                Time *
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you cover? Link to notes or chapters..."
              className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[var(--invert-bg)] text-[var(--invert-text)] hover:opacity-90 rounded-[var(--radius-button)] text-xs font-semibold uppercase tracking-[0.04em] transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {initialSession ? "Save Changes" : "Schedule Session"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
