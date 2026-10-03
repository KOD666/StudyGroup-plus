"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare, Send, Copy, Download, Check } from "lucide-react";
import { EmojiPickerButton } from "@/components/chat/EmojiPickerButton";
import { useInCallChat } from "./InCallChatContext";

interface InCallChatPanelProps {
  roomName?: string;
}

export function InCallChatPanel({
  roomName = "study-session",
}: InCallChatPanelProps) {
  const { messages, sendMessage, copyChatToClipboard, downloadChat } =
    useInCallChat();
  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText("");
    cursorRef.current = null;
    await sendMessage(text);
  }

  async function handleCopy() {
    const success = await copyChatToClipboard();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    const current = inputText;
    const start =
      cursorRef.current !== null
        ? cursorRef.current
        : input?.selectionStart !== null && input?.selectionStart !== undefined
          ? input.selectionStart
          : current.length;
    const end =
      input?.selectionEnd !== null && input?.selectionEnd !== undefined
        ? input.selectionEnd
        : start;

    setInputText(current.slice(0, start) + emoji + current.slice(end));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="px-4 py-2 border-b border-[var(--border-hairline)] bg-[var(--bg-inset)] flex items-center justify-between">
        <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={messages.length === 0}
            className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Copy chat history"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#10b981]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => downloadChat(roomName)}
            disabled={messages.length === 0}
            className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Download chat history"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
        {messages.length === 0 ? (
          <div className="h-full min-h-[14rem] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)]">
            <MessageSquare className="w-8 h-8 text-[var(--text-secondary)] opacity-40 mb-2" />
            <span className="font-serif text-sm text-[var(--text-primary)]">
              In-Call Room Chat
            </span>
            <p className="font-sans text-xs text-[var(--text-secondary)] max-w-xs mt-1">
              Messages are delivered live to peers and saved for rejoining
              members.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: [0.25, 1, 0.5, 1] }}
              className={`flex flex-col space-y-1 ${msg.isSelf ? "items-end" : "items-start"}`}
            >
              <div className="flex items-baseline gap-2 text-[0.625rem] font-mono text-[var(--text-secondary)]">
                <span className="font-medium text-[var(--text-primary)]">
                  {msg.isSelf ? "You" : msg.senderName}
                </span>
                <span>{msg.time}</span>
              </div>
              <div
                className={`p-2.5 rounded-[var(--radius-button)] text-xs max-w-[85%] leading-relaxed ${
                  msg.isSelf
                    ? "bg-[var(--invert-bg)] text-[var(--invert-text)]"
                    : "bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--border-hairline)]"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[var(--border-hairline)] bg-[var(--bg-inset)] flex items-center gap-2"
      >
        <EmojiPickerButton onEmojiSelect={handleEmojiSelect} align="left" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Message room..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            cursorRef.current = e.target.selectionStart;
          }}
          onSelect={(e) => {
            cursorRef.current = e.currentTarget.selectionStart;
          }}
          className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
