"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Smile } from "lucide-react";
import { Theme, EmojiClickData } from "emoji-picker-react";

// Dynamically import emoji-picker-react with SSR disabled to prevent hydration mismatches
const Picker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => (
    <div className="w-[310px] h-[360px] bg-[var(--bg-overlay)] flex items-center justify-center font-mono text-xs text-[var(--text-secondary)]">
      Loading emojis...
    </div>
  ),
});

export interface EmojiPickerButtonProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  align?: "left" | "right";
  className?: string;
}

/**
 * Reusable EmojiPickerButton control for chat message inputs.
 * Adheres to DESIGN.md monochrome/stepped surface styling and permissive MIT library.
 */
export function EmojiPickerButton({
  onEmojiSelect,
  disabled = false,
  align = "left",
  className = "",
}: EmojiPickerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Add emoji"
        title="Add emoji"
        aria-expanded={isOpen}
        className={`p-2 rounded-[var(--radius-button)] transition-colors duration-[var(--dur-fast)] cursor-pointer flex items-center justify-center ${
          isOpen
            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Smile className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 z-50 border border-[var(--border-hairline)] rounded-[var(--radius-card)] bg-[var(--bg-overlay)] shadow-2xl overflow-hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={
            {
              "--epr-bg-color": "var(--bg-overlay)",
              "--epr-category-label-bg-color": "var(--bg-overlay)",
              "--epr-text-color": "var(--text-primary)",
              "--epr-search-input-bg-color": "var(--bg-inset)",
              "--epr-search-input-text-color": "var(--text-primary)",
              "--epr-hover-bg-color": "var(--bg-elevated)",
              "--epr-focus-bg-color": "var(--bg-elevated)",
              "--epr-border-color": "var(--border-hairline)",
              "--epr-preview-text-color": "var(--text-primary)",
            } as React.CSSProperties
          }
        >
          <Picker
            theme={Theme.DARK}
            onEmojiClick={handleEmojiClick}
            lazyLoadEmojis={true}
            autoFocusSearch={false}
            searchPlaceHolder="Search emoji..."
            previewConfig={{ showPreview: false }}
            width={310}
            height={360}
          />
        </div>
      )}
    </div>
  );
}
