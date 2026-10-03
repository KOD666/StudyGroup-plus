"use client";

import { useEffect, useRef, useCallback } from "react";
import { Room } from "livekit-client";
import { clientToFraction } from "./cursorCoordinates";

interface UseCursorSenderProps {
  room: Room | null;
  docId: string | null;
  pageNumber: number;
  containerRef: React.RefObject<HTMLElement | null>;
}

export const CURSOR_TOPIC = "doc-cursors";
export const CURSOR_THROTTLE_MS = 50;

export function useCursorSender({
  room,
  docId,
  pageNumber,
  containerRef,
}: UseCursorSenderProps) {
  const lastSentTimeRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const sendCursorPosition = useCallback(
    (x: number, y: number) => {
      if (!room?.localParticipant || !docId) return;

      const payload = JSON.stringify({
        type: "doc-cursor",
        docId,
        page: pageNumber,
        x,
        y,
      });

      try {
        const encoder = new TextEncoder();
        room.localParticipant.publishData(encoder.encode(payload), {
          reliable: false, // Lossy / unreliable mode for low-latency cursor tracking
          topic: CURSOR_TOPIC,
        });
      } catch (err) {
        // Drop lossy cursor packet without throwing
      }
    },
    [room, docId, pageNumber]
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    function attach(): boolean {
      const container = containerRef.current;
      if (!container || !room || !docId) return false;

      const handlePointerMove = (e: PointerEvent) => {
        const now = performance.now();
        if (now - lastSentTimeRef.current < CURSOR_THROTTLE_MS) {
          return;
        }

        const rect = container.getBoundingClientRect();
        const { x, y } = clientToFraction(e.clientX, e.clientY, rect);

        // Only send when pointer actually moved
        if (
          lastPosRef.current &&
          Math.abs(lastPosRef.current.x - x) < 0.001 &&
          Math.abs(lastPosRef.current.y - y) < 0.001
        ) {
          return;
        }

        lastSentTimeRef.current = now;
        lastPosRef.current = { x, y };
        sendCursorPosition(x, y);
      };

      container.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });

      cleanup = () => {
        container.removeEventListener("pointermove", handlePointerMove);
      };
      return true;
    }

    if (!attach()) {
      const interval = setInterval(() => {
        if (attach()) {
          clearInterval(interval);
        }
      }, 100);
      return () => {
        clearInterval(interval);
        if (cleanup) cleanup();
      };
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [containerRef, room, docId, sendCursorPosition]);
}
