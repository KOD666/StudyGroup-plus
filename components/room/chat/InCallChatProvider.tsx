"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Room, RoomEvent, RemoteParticipant } from "livekit-client";
import { InCallChatContext } from "./InCallChatContext";
import { InCallMessage } from "./types";

interface InCallChatProviderProps {
  groupId: string;
  activeSessionId: string | null;
  room: Room | null;
  currentUserId?: string;
  currentUserName: string;
  onMessagesChange?: (messages: InCallMessage[]) => void;
  children: React.ReactNode;
}

export function InCallChatProvider({
  groupId,
  activeSessionId,
  room,
  currentUserId,
  currentUserName,
  onMessagesChange,
  children,
}: InCallChatProviderProps) {
  const [messages, setMessages] = useState<InCallMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    onMessagesChange?.(messages);
  }, [messages, onMessagesChange]);

  // Fetch persisted session history (replay window: 50 messages, max 24h)
  useEffect(() => {
    let isCancelled = false;
    const sId = activeSessionId || "active";

    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/groups/${groupId}/sessions/${sId}/messages`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled || !Array.isArray(data.messages)) return;

        setMessages((prev) => {
          const combined = [...data.messages, ...prev];
          const deduplicated: InCallMessage[] = [];
          const seen = new Set<string>();

          for (const msg of combined) {
            if (!seen.has(msg.id)) {
              seen.add(msg.id);
              deduplicated.push({
                ...msg,
                isSelf: msg.senderId
                  ? msg.senderId === currentUserId
                  : msg.senderName === currentUserName,
              });
            }
          }
          seenIdsRef.current = seen;
          return deduplicated;
        });
      } catch (err) {
        console.warn("Could not load in-call chat history:", err);
      } finally {
        if (!isCancelled) setIsLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      isCancelled = true;
    };
  }, [groupId, activeSessionId, currentUserId, currentUserName]);

  // Listen to incoming LiveKit data channel messages
  useEffect(() => {
    if (!room) return;

    const onDataReceived = (
      payload: Uint8Array,
      participant?: RemoteParticipant
    ) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type === "chat" && data.text && data.id) {
          if (seenIdsRef.current.has(data.id)) return;
          seenIdsRef.current.add(data.id);

          const now = new Date();
          const timeStr =
            data.time ||
            now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const sender =
            data.senderName ||
            participant?.name ||
            participant?.identity ||
            "Member";
          const isSelf =
            data.senderId === currentUserId ||
            (currentUserId && participant?.identity === currentUserId);

          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              senderName: sender,
              senderId: data.senderId || participant?.identity,
              text: data.text,
              time: timeStr,
              isSelf: Boolean(isSelf),
            },
          ]);
        }
      } catch {
        // Non-chat or malformed data channel packet
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room, currentUserId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const msgId = `incall-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      seenIdsRef.current.add(msgId);

      const optimisticMsg: InCallMessage = {
        id: msgId,
        senderName: currentUserName,
        senderId: currentUserId,
        text: trimmed,
        time: timeStr,
        isSelf: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      // 1. Broadcast over LiveKit data channel for instant delivery if room is ready
      if (room?.localParticipant) {
        try {
          const payload = JSON.stringify({
            type: "chat",
            id: msgId,
            senderName: currentUserName,
            senderId: currentUserId,
            text: trimmed,
            time: timeStr,
          });
          await room.localParticipant.publishData(
            new TextEncoder().encode(payload),
            { reliable: true }
          );
        } catch (err) {
          console.warn("Failed to publish chat to data channel:", err);
        }
      }

      // 2. Persist in database through server route
      const sId = activeSessionId || "active";
      fetch(`/api/groups/${groupId}/sessions/${sId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msgId, text: trimmed }),
      }).catch((err) => {
        console.warn("Failed to persist in-call message to server:", err);
      });
    },
    [room, currentUserName, currentUserId, groupId, activeSessionId]
  );

  const copyChatToClipboard = useCallback(async () => {
    if (messages.length === 0) return false;
    const plainText = messages
      .map(
        (m) =>
          `${m.isSelf ? currentUserName : m.senderName} [${m.time}]: ${m.text}`
      )
      .join("\n");

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(plainText);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = plainText;
        textarea.style.position = "fixed";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      return true;
    } catch {
      return false;
    }
  }, [messages, currentUserName]);

  const downloadChat = useCallback(
    (roomName = "study-session") => {
      if (messages.length === 0) return;
      let md = `# In-Call Chat Log: ${roomName}\n\n`;
      md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
      messages.forEach((msg) => {
        md += `**${msg.isSelf ? currentUserName : msg.senderName}** [${msg.time}]:  \n${msg.text}\n\n`;
      });

      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${roomName}-${new Date().toISOString().slice(0, 10)}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [messages, currentUserName]
  );

  return (
    <InCallChatContext.Provider
      value={{
        messages,
        sendMessage,
        copyChatToClipboard,
        downloadChat,
        isLoadingHistory,
      }}
    >
      {children}
    </InCallChatContext.Provider>
  );
}
