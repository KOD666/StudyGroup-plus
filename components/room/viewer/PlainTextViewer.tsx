"use client";

import React, { useRef } from "react";
import { Room } from "livekit-client";
import {
  useCursorSender,
  useCursorReceiver,
  DocumentCursorOverlay,
} from "./cursors";

interface PlainTextViewerProps {
  content: string;
  docId: string | null;
  zoom: number;
  room: Room | null;
  currentUserId?: string;
}

export function PlainTextViewer({
  content,
  docId,
  zoom,
  room,
  currentUserId,
}: PlainTextViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useCursorSender({
    room,
    docId,
    pageNumber: 1,
    containerRef,
  });

  const cursors = useCursorReceiver({
    room,
    currentDocId: docId,
    currentPageNumber: 1,
    currentUserId,
  });

  return (
    <div className="w-full flex justify-center p-4">
      <div
        ref={containerRef}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
        }}
        className="relative max-w-3xl w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-sm transition-transform duration-75"
      >
        <pre className="font-mono text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words select-text">
          {content}
        </pre>
        <DocumentCursorOverlay cursors={cursors} />
      </div>
    </div>
  );
}
