"use client";

import React, { useEffect, useRef } from "react";
import { Share2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActiveSharer } from "./types";

interface ScreenShareStageProps {
  activeSharer: ActiveSharer;
  onStopSharing?: () => void;
}

export function ScreenShareStage({
  activeSharer,
  onStopSharing,
}: ScreenShareStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    const track = activeSharer.track;
    if (!videoEl || !track) return;

    track.attach(videoEl);

    return () => {
      track.detach(videoEl);
    };
  }, [activeSharer.track]);

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)]">
      {/* Shared Screen Video Display */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />

      {/* Screen Share Status Bar / Header Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-[var(--border-hairline)] shadow-sm pointer-events-auto">
          <Share2 className="w-3.5 h-3.5 text-[#d97706]" />
          <span className="font-mono text-xs text-[var(--text-primary)]">
            {activeSharer.isLocal ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                You are sharing your screen
              </span>
            ) : (
              `${activeSharer.name} is sharing`
            )}
          </span>
        </div>

        {activeSharer.isLocal && onStopSharing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onStopSharing}
            icon={<StopCircle className="w-3.5 h-3.5 text-[#e5484d]" />}
            className="pointer-events-auto text-xs bg-[var(--bg-elevated)]/90 backdrop-blur-md border-[var(--border-hairline)] hover:border-[#e5484d]"
          >
            Stop Sharing
          </Button>
        )}
      </div>
    </div>
  );
}
