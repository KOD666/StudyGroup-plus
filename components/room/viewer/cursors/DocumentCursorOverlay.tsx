"use client";

import React from "react";
import { RemoteCursor } from "./useCursorReceiver";

interface DocumentCursorOverlayProps {
  cursors: RemoteCursor[];
}

export function DocumentCursorOverlay({ cursors }: DocumentCursorOverlayProps) {
  if (cursors.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {cursors.map((cursor) => {
        const leftPercent = cursor.x * 100;
        const topPercent = cursor.y * 100;

        return (
          <div
            key={cursor.participantId}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              transition: "left 60ms linear, top 60ms linear",
            }}
            className="absolute transform -translate-x-0.5 -translate-y-0.5 flex flex-col items-start pointer-events-none select-none"
          >
            {/* Canva-style SVG cursor arrow */}
            <svg
              width="18"
              height="20"
              viewBox="0 0 16 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm"
            >
              <path
                d="M1 1L7 16L9.5 10.5L15 8L1 1Z"
                fill={cursor.color}
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>

            {/* Name label badge */}
            <div
              style={{ backgroundColor: cursor.color }}
              className="mt-0.5 ml-3 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium text-white shadow-sm whitespace-nowrap leading-tight max-w-[120px] truncate"
            >
              {cursor.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
