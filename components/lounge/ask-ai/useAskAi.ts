"use client";

import { useState, useCallback, useRef } from "react";
import { AiChatMessage } from "./types";

interface UseAskAiProps {
  groupId: string;
}

export function useAskAi({ groupId }: UseAskAiProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const prompt = (textToSend || input).trim();
      if (!prompt || isStreaming) return;

      setErrorMessage(null);
      setInput("");

      const userMsg: AiChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const assistantMsgId = `assistant-${Date.now()}`;
      const placeholderAssistantMsg: AiChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const nextMessages = [...messages, userMsg];
      setMessages([...nextMessages, placeholderAssistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const payloadMessages = nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch(`/api/groups/${groupId}/ask-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payloadMessages }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const friendly =
            errData?.error ||
            "The study assistant could not complete your request. Please try again.";
          setErrorMessage(friendly);
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          return;
        }

        if (!res.body) {
          setErrorMessage(
            "No response was received from the assistant. Please try again."
          );
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
            )
          );
        }
      } catch (err: unknown) {
        const errorObj = err as Error;
        if (errorObj?.name !== "AbortError") {
          console.warn("Ask AI error:", err);
          setErrorMessage(
            "Connection interrupted. Please check your internet and try again."
          );
          setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [input, isStreaming, messages, groupId]
  );

  const clearChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setErrorMessage(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    isStreaming,
    errorMessage,
    sendMessage,
    clearChat,
  };
}
