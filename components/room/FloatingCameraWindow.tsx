"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  GripHorizontal,
  MicOff,
  FlipHorizontal,
  ExternalLink,
} from "lucide-react";
import { Track, RemoteParticipant, ParticipantEvent } from "livekit-client";

interface FloatingCameraWindowProps {
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];
  isVideoOff: boolean;
  isMuted: boolean;
  isSelfViewMirrored: boolean;
  onToggleMirror: () => void;
  userName: string;
  scholarInitials: string;
  onPopOutVideo?: () => void;
  hasDocPiPSupport?: boolean;
}

export function FloatingCameraWindow({
  localStream,
  remoteParticipants,
  isVideoOff,
  isMuted,
  isSelfViewMirrored,
  onToggleMirror,
  userName,
  scholarInitials,
  onPopOutVideo,
  hasDocPiPSupport = false,
}: FloatingCameraWindowProps) {
  const floatingLocalVideoRef = useRef<HTMLVideoElement>(null);
  const floatingRemoteVideoRef = useRef<HTMLVideoElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  // Position & Size state with localStorage persistence
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sg_floating_camera_pos");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === "number" && typeof parsed.y === "number") {
            return {
              x: Math.min(parsed.x, window.innerWidth - 300),
              y: Math.min(Math.max(parsed.y, 60), window.innerHeight - 200),
            };
          }
        }
      } catch {}
      return { x: Math.max(20, window.innerWidth - 360), y: 70 };
    }
    return { x: 20, y: 70 };
  });

  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sg_floating_camera_size");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.width === "number" && typeof parsed.height === "number") {
            return {
              width: Math.max(240, Math.min(parsed.width, 500)),
              height: Math.max(160, Math.min(parsed.height, 380)),
            };
          }
        }
      } catch {}
    }
    return { width: 320, height: 210 };
  });

  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [remoteMuted, setRemoteMuted] = useState(false);
  const primaryRemote = remoteParticipants.length > 0 ? remoteParticipants[0] : null;

  // Sync local stream with local video ref
  useEffect(() => {
    if (floatingLocalVideoRef.current && localStream) {
      floatingLocalVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Sync primary remote participant track with remote video ref
  useEffect(() => {
    if (!primaryRemote) {
      setHasRemoteVideo(false);
      return;
    }

    function syncRemote() {
      if (!primaryRemote) return;
      const videoPub =
        primaryRemote.getTrackPublication(Track.Source.Camera) ||
        primaryRemote.getTrackPublication(Track.Source.ScreenShare);
      const audioPub = primaryRemote.getTrackPublication(Track.Source.Microphone);

      if (videoPub?.track && !videoPub.isMuted) {
        if (floatingRemoteVideoRef.current) {
          videoPub.track.attach(floatingRemoteVideoRef.current);
        }
        setHasRemoteVideo(true);
      } else {
        if (floatingRemoteVideoRef.current && videoPub?.track) {
          videoPub.track.detach(floatingRemoteVideoRef.current);
        }
        setHasRemoteVideo(false);
      }
      setRemoteMuted(Boolean(!audioPub || audioPub.isMuted));
    }

    syncRemote();

    primaryRemote.on(ParticipantEvent.TrackSubscribed, syncRemote);
    primaryRemote.on(ParticipantEvent.TrackPublished, syncRemote);
    primaryRemote.on(ParticipantEvent.TrackUnsubscribed, syncRemote);
    primaryRemote.on(ParticipantEvent.TrackUnpublished, syncRemote);
    primaryRemote.on(ParticipantEvent.TrackMuted, syncRemote);
    primaryRemote.on(ParticipantEvent.TrackUnmuted, syncRemote);

    return () => {
      primaryRemote.off(ParticipantEvent.TrackSubscribed, syncRemote);
      primaryRemote.off(ParticipantEvent.TrackPublished, syncRemote);
      primaryRemote.off(ParticipantEvent.TrackUnsubscribed, syncRemote);
      primaryRemote.off(ParticipantEvent.TrackUnpublished, syncRemote);
      primaryRemote.off(ParticipantEvent.TrackMuted, syncRemote);
      primaryRemote.off(ParticipantEvent.TrackUnmuted, syncRemote);
    };
  }, [primaryRemote]);

  // Handle Drag End to remember position inside viewport
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; point: { x: number; y: number } }
  ) => {
    const maxX = Math.max(0, window.innerWidth - size.width - 16);
    const maxY = Math.max(60, window.innerHeight - size.height - 16);
    const newX = Math.max(16, Math.min(position.x + info.offset.x, maxX));
    const newY = Math.max(60, Math.min(position.y + info.offset.y, maxY));
    const nextPos = { x: newX, y: newY };
    setPosition(nextPos);
    try {
      localStorage.setItem("sg_floating_camera_pos", JSON.stringify(nextPos));
    } catch {}
  };

  // Corner Resize Handler
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.width;
    const startH = size.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const nextW = Math.max(240, Math.min(startW + (moveEvent.clientX - startX), 540));
      const nextH = Math.max(160, Math.min(startH + (moveEvent.clientY - startY), 400));
      setSize({ width: nextW, height: nextH });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      try {
        localStorage.setItem("sg_floating_camera_size", JSON.stringify(size));
      } catch {}
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const remoteName = primaryRemote
    ? primaryRemote.name || primaryRemote.identity || "Study Peer"
    : null;

  return (
    <motion.div
      ref={windowRef}
      drag
      dragMomentum={false}
      dragElastic={0.05}
      onDragEnd={handleDragEnd}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 45,
      }}
      className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] shadow-2xl flex flex-col overflow-hidden select-none group"
    >
      {/* Draggable Title Header */}
      <div className="h-8 px-2.5 bg-[var(--bg-inset)] border-b border-[var(--border-hairline)] flex items-center justify-between cursor-move shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)]">
          <GripHorizontal className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d] animate-live-breathe inline-block" />
          <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--text-primary)]">
            {remoteName ? remoteName : "Live Camera"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Mirror toggle for self-view */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMirror();
            }}
            className={`p-1 rounded-[var(--radius-button)] transition-colors cursor-pointer ${
              isSelfViewMirrored
                ? "bg-[var(--invert-bg)] text-[var(--invert-text)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            }`}
            title={
              isSelfViewMirrored
                ? "Self-view mirrored (Click for normal)"
                : "Self-view normal (Click to mirror)"
            }
          >
            <FlipHorizontal className="w-3 h-3" />
          </button>

          {/* Picture in picture popout button */}
          {hasDocPiPSupport && onPopOutVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPopOutVideo();
              }}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
              title="Pop out video (always-on-top window)"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Video feeds container */}
      <div className="flex-1 relative bg-[var(--bg-inset)] overflow-hidden">
        {primaryRemote ? (
          /* Primary Remote Video with corner self-view */
          <>
            <video
              ref={floatingRemoteVideoRef}
              autoPlay
              playsInline
              style={{ transform: "none" }}
              className={`w-full h-full object-cover ${hasRemoteVideo ? "block" : "hidden"}`}
            />
            {!hasRemoteVideo && (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center font-mono font-semibold text-xs text-[var(--text-primary)] mb-1">
                  {primaryRemote.name ? primaryRemote.name.substring(0, 2).toUpperCase() : "SP"}
                </div>
                <span className="font-mono text-[0.625rem] text-[var(--text-secondary)]">
                  {remoteMuted ? "Remote muted" : "Camera off"}
                </span>
              </div>
            )}

            {/* Corner Inset Self-View */}
            <div className="absolute bottom-2 right-2 w-20 h-14 rounded-[var(--radius-button)] overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-elevated)] shadow-md">
              <video
                ref={floatingLocalVideoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: isSelfViewMirrored ? "scaleX(-1)" : "none" }}
                className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
              />
              {isVideoOff && (
                <div className="w-full h-full flex items-center justify-center font-mono text-[0.625rem] font-bold text-[var(--text-secondary)]">
                  {scholarInitials}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Single User Self-View */
          <>
            <video
              ref={floatingLocalVideoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: isSelfViewMirrored ? "scaleX(-1)" : "none" }}
              className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
            />
            {isVideoOff && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-xs font-semibold text-[var(--text-primary)] mb-1">
                  {scholarInitials}
                </div>
                <span className="font-mono text-[0.625rem] text-[var(--text-secondary)]">
                  {userName} (Camera off)
                </span>
              </div>
            )}
          </>
        )}

        {/* Status badges overlay */}
        <div className="absolute top-1.5 left-2 pointer-events-none flex items-center gap-1">
          {isMuted && (
            <span className="p-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)]/90 text-[var(--text-secondary)] border border-[var(--border-hairline)]">
              <MicOff className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Bottom Right Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize flex items-end justify-end p-0.5 z-10"
          title="Drag to resize mini window"
        >
          <div className="w-1.5 h-1.5 border-r border-b border-[var(--text-secondary)]" />
        </div>
      </div>
    </motion.div>
  );
}
