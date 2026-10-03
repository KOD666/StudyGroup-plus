"use client";

import { useState, useEffect, useRef } from "react";
import { Room, RoomEvent, RemoteParticipant } from "livekit-client";
import { getParticipantCursorColor } from "./cursorPalette";
import { CURSOR_TOPIC } from "./useCursorSender";

export interface RemoteCursor {
  participantId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastMoved: number;
}

interface UseCursorReceiverProps {
  room: Room | null;
  currentDocId: string | null;
  currentPageNumber: number;
  currentUserId?: string;
}

const CURSOR_FADE_TIMEOUT_MS = 3000; // 3 seconds timeout before fading out

export function useCursorReceiver({
  room,
  currentDocId,
  currentPageNumber,
  currentUserId,
}: UseCursorReceiverProps) {
  const [cursors, setCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const cursorsRef = useRef<Map<string, RemoteCursor>>(new Map());

  // Clear cursors if document changes
  useEffect(() => {
    cursorsRef.current.clear();
    setCursors(new Map());
  }, [currentDocId]);

  // Clean up stale cursors that have not moved in 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const current = cursorsRef.current;

      current.forEach((cursor, id) => {
        if (now - cursor.lastMoved > CURSOR_FADE_TIMEOUT_MS) {
          current.delete(id);
          changed = true;
        }
      });

      if (changed) {
        setCursors(new Map(current));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!room || !currentDocId) return;

    const onDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string
    ) => {
      // Validate topic or inspect payload
      if (topic && topic !== CURSOR_TOPIC) return;

      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type !== "doc-cursor") return;

        // Take identity from LiveKit participant (never from payload)
        const participantId = participant?.identity;
        if (!participantId || participantId === currentUserId) return;

        // Ignore messages for other documents or pages
        if (data.docId !== currentDocId || data.page !== currentPageNumber) {
          if (cursorsRef.current.has(participantId)) {
            cursorsRef.current.delete(participantId);
            setCursors(new Map(cursorsRef.current));
          }
          return;
        }

        // Validate shape and clamp coordinates strictly to [0, 1]
        if (typeof data.x !== "number" || typeof data.y !== "number") return;
        const clampedX = Math.max(0, Math.min(1, data.x));
        const clampedY = Math.max(0, Math.min(1, data.y));

        // Name from participant metadata/name, capped to 24 chars, pure text
        const rawName = participant.name || participant.identity || "Peer";
        const cleanName = String(rawName).trim().slice(0, 24);
        const color = getParticipantCursorColor(participantId);

        const updatedCursor: RemoteCursor = {
          participantId,
          name: cleanName,
          color,
          x: clampedX,
          y: clampedY,
          lastMoved: Date.now(),
        };

        cursorsRef.current.set(participantId, updatedCursor);
        setCursors(new Map(cursorsRef.current));
      } catch {
        // Drop malformed cursor packet
      }
    };

    const onParticipantDisconnected = (participant: RemoteParticipant) => {
      if (cursorsRef.current.has(participant.identity)) {
        cursorsRef.current.delete(participant.identity);
        setCursors(new Map(cursorsRef.current));
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected);
    };
  }, [room, currentDocId, currentPageNumber, currentUserId]);

  return Array.from(cursors.values());
}
