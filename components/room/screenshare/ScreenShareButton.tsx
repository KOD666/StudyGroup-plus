"use client";

import React from "react";
import { Share2 } from "lucide-react";

interface ScreenShareButtonProps {
  canShare: boolean;
  isSharing: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
  onToggle: () => void;
}

export function ScreenShareButton({
  canShare,
  isSharing,
  disabled = false,
  disabledReason,
  onToggle,
}: ScreenShareButtonProps) {
  if (!canShare) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`px-3.5 py-2 rounded-[var(--radius-button)] border text-xs font-mono flex items-center gap-2 transition-colors duration-[var(--dur-fast)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        isSharing
          ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
          : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
      }`}
      title={disabledReason || (isSharing ? "Stop Sharing" : "Screen Share")}
    >
      <Share2 className="w-3.5 h-3.5" />
      <span>{isSharing ? "Stop Sharing" : "Screen Share"}</span>
    </button>
  );
}
