"use client";

import React, { useRef } from "react";
import { Room } from "livekit-client";
import {
  useCursorSender,
  useCursorReceiver,
  DocumentCursorOverlay,
} from "./cursors";

interface ImageViewerProps {
  url: string;
  title: string;
  docId: string | null;
  zoom: number;
  room: Room | null;
  currentUserId?: string;
}

export function ImageViewer({
  url,
  title,
  docId,
  zoom,
  room,
  currentUserId,
}: ImageViewerProps) {
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
        className="relative max-w-4xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-4 shadow-sm transition-transform duration-75 overflow-hidden"
      >
        <img
          src={url}
          alt={title}
          className="max-w-full max-h-[75vh] object-contain rounded-sm mx-auto block"
        />
        <DocumentCursorOverlay cursors={cursors} />
      </div>
    </div>
  );
}
