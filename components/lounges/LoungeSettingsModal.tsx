"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Settings, AlertCircle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isValidYouTubeUrl } from "@/lib/utils";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";

interface LoungeSettingsModalProps {
  groupId: string;
  groupName: string;
  initialYoutubeUrl?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (newYoutubeUrl: string | null) => void;
}

export function LoungeSettingsModal({
  groupId,
  groupName,
  initialYoutubeUrl = null,
  isOpen,
  onClose,
  onSaved,
}: LoungeSettingsModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState(initialYoutubeUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isOpen) {
      setYoutubeUrl(initialYoutubeUrl || "");
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialYoutubeUrl]);

  if (!isOpen) return null;

  async function handleSave(urlToSave: string | null) {
    setError(null);
    setSuccessMessage(null);

    const trimmed = (urlToSave ?? youtubeUrl).trim();

    // If non-empty, perform client-side validation
    if (trimmed !== "" && !isValidYouTubeUrl(trimmed)) {
      setError(
        "Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
      );
      return;
    }

    setIsSaving(true);
    const finalUrl = trimmed === "" ? null : trimmed;

    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: finalUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update lounge settings");
      }

      setSuccessMessage(
        finalUrl ? "YouTube link saved successfully." : "YouTube link cleared."
      );
      onSaved(finalUrl);

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while saving."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleClear() {
    setYoutubeUrl("");
    handleSave("");
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop: fades to --bg-primary at 60% opacity per DESIGN.md §5 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(10,10,10,0.6)] backdrop-blur-xs"
        />

        {/* Modal: scale 0.96 -> 1 + fade, --dur-slow (450ms), --ease-out-expo */}
        <motion.div
          initial={
            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
          }
          transition={{
            duration: shouldReduceMotion ? 0.15 : 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 sm:p-8 z-10 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[var(--border-hairline)] mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-secondary)]">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
                  Lounge Settings
                </h3>
                <p className="font-sans text-xs text-[var(--text-secondary)]">
                  Manage external study streams and settings for &ldquo;
                  {groupName}&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave(youtubeUrl);
            }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="youtube-url-input"
                  className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--text-secondary)] flex items-center gap-1.5"
                >
                  <YouTubeIcon className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                  YouTube Link / Stream
                </label>
                {initialYoutubeUrl && (
                  <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                    Currently linked
                  </span>
                )}
              </div>

              <p className="font-sans text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                Provide a YouTube video, live stream, or lecture URL for this
                lounge. When set, a monochrome YouTube link appears for members
                to open in a new tab.
              </p>

              <div className="relative">
                <input
                  id="youtube-url-input"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full bg-[var(--bg-inset)] border rounded-[var(--radius-button)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none transition-colors duration-[var(--dur-fast)] ${
                    error
                      ? "border-[#e5484d] focus:border-[#e5484d]"
                      : "border-[var(--border-hairline)] focus:border-[var(--border-focus)]"
                  }`}
                />
              </div>

              {/* Inline Validation Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-center gap-2 mt-2.5 text-xs text-[#e5484d] font-mono leading-relaxed"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Notification */}
              {successMessage && (
                <div
                  role="status"
                  className="flex items-center gap-2 mt-2.5 text-xs text-[var(--text-primary)] font-mono leading-relaxed"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
              <div>
                {initialYoutubeUrl ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleClear}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-mono text-[var(--text-secondary)] hover:text-[#e5484d] hover:bg-[var(--bg-inset)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Link
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
