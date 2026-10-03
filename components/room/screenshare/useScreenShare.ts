"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Room,
  Track,
  ParticipantEvent,
  RemoteParticipant,
} from "livekit-client";
import { ActiveSharer } from "./types";

interface UseScreenShareProps {
  room: Room | null;
  remoteParticipants: RemoteParticipant[];
  userName: string;
}

export function useScreenShare({
  room,
  remoteParticipants,
  userName,
}: UseScreenShareProps) {
  const [canShareScreen, setCanShareScreen] = useState(false);
  const [isLocalSharing, setIsLocalSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const localTrackRef = useRef<Track | null>(null);

  // Check browser capability (desktop browser with getDisplayMedia)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getDisplayMedia === "function"
    ) {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setCanShareScreen(!isMobile);
    } else {
      setCanShareScreen(false);
    }
  }, []);

  // Find if any remote participant is currently sharing screen
  const remoteSharer = useCallback((): ActiveSharer | null => {
    for (const participant of remoteParticipants) {
      const pub = participant.getTrackPublication(Track.Source.ScreenShare);
      if (pub?.track && !pub.isMuted) {
        return {
          isLocal: false,
          participantId: participant.identity,
          name:
            participant.name || participant.identity || "Remote Participant",
          track: pub.track,
        };
      }
    }
    return null;
  }, [remoteParticipants]);

  const currentRemoteSharer = remoteSharer();

  // Active sharer resolution (local takes precedence if sharing, else remote)
  const activeSharer: ActiveSharer | null = isLocalSharing
    ? {
        isLocal: true,
        participantId: room?.localParticipant?.identity || "local",
        name: userName || "You",
        track: localTrackRef.current || undefined,
      }
    : currentRemoteSharer;

  // Handle native browser "Stop sharing" button
  const handleNativeTrackEnded = useCallback(() => {
    setIsLocalSharing(false);
    localTrackRef.current = null;
    if (room?.localParticipant) {
      room.localParticipant.setScreenShareEnabled(false).catch(() => {});
    }
  }, [room]);

  // Listen to local participant unpublish events
  useEffect(() => {
    if (!room?.localParticipant) return;
    const local = room.localParticipant;

    const onLocalUnpublished = (pub: { source: Track.Source }) => {
      if (pub.source === Track.Source.ScreenShare) {
        setIsLocalSharing(false);
        localTrackRef.current = null;
      }
    };

    local.on(ParticipantEvent.LocalTrackUnpublished, onLocalUnpublished);
    return () => {
      local.off(ParticipantEvent.LocalTrackUnpublished, onLocalUnpublished);
    };
  }, [room]);

  const startScreenShare = useCallback(async () => {
    setShareError(null);
    if (!room?.localParticipant) return false;

    // Check if another person is already sharing
    const currentActive = remoteSharer();
    if (currentActive) {
      setShareError(
        `Cannot share screen: ${currentActive.name} is already sharing.`
      );
      return false;
    }

    try {
      const pub = await room.localParticipant.setScreenShareEnabled(true);
      if (pub?.track) {
        localTrackRef.current = pub.track;
        // Listen to browser native bar "Stop sharing" click
        const mediaStreamTrack = pub.track.mediaStreamTrack;
        if (mediaStreamTrack) {
          mediaStreamTrack.onended = handleNativeTrackEnded;
        }
      }
      setIsLocalSharing(true);
      return true;
    } catch (err: unknown) {
      const errorObj = err as Error;
      // If user simply cancelled browser picker, don't show an error toast
      if (
        errorObj.name !== "NotAllowedError" &&
        errorObj.name !== "AbortError"
      ) {
        setShareError(
          "Failed to start screen sharing. Please check permissions."
        );
      }
      setIsLocalSharing(false);
      localTrackRef.current = null;
      return false;
    }
  }, [room, remoteSharer, handleNativeTrackEnded]);

  const stopScreenShare = useCallback(async () => {
    setShareError(null);
    if (!room?.localParticipant) return;

    try {
      await room.localParticipant.setScreenShareEnabled(false);
    } catch (err) {
      console.warn("Failed to stop screen share:", err);
    } finally {
      setIsLocalSharing(false);
      localTrackRef.current = null;
    }
  }, [room]);

  const toggleScreenShare = useCallback(() => {
    if (isLocalSharing) {
      return stopScreenShare();
    }
    return startScreenShare();
  }, [isLocalSharing, startScreenShare, stopScreenShare]);

  return {
    canShareScreen,
    isLocalSharing,
    activeSharer,
    shareError,
    setShareError,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
  };
}
