"use client";

import React, { useRef, useEffect } from "react";
import { Sparkles, Send, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useAskAi } from "./useAskAi";
import { AskAiMessageItem } from "./AskAiMessageItem";

interface AskAiPanelProps {
  groupId: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize key concepts for exam review",
  "Explain this topic in simple terms with an example",
  "Generate 3 practice questions with explanations",
  "Create a structured study guide outline",
];

export function AskAiPanel({ groupId }: AskAiPanelProps) {
  const {
    messages,
    input,
    setInput,
    isStreaming,
    errorMessage,
    sendMessage,
    clearChat,
  } = useAskAi({ groupId });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage();
  }

  return (
    <div className="w-full flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] overflow-hidden shadow-sm">
      {/* Header Bar */}
      <div className="px-5 py-3.5 border-b border-[var(--border-hairline)] bg-[var(--bg-inset)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[rgba(217,119,6,0.15)] flex items-center justify-center text-[#d97706]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-normal text-[var(--text-primary)]">
              Ask AI Study Assistant
            </h3>
            <p className="font-mono text-[0.625rem] text-[var(--text-secondary)]">
              Powered by Groq • Session Chat
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            disabled={isStreaming}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-button)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-[0.6875rem] transition-colors cursor-pointer disabled:opacity-50"
            title="Clear conversation history"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Error Notice Banner */}
      {errorMessage && (
        <div className="mx-4 mt-4 p-3 rounded-[var(--radius-button)] bg-[rgba(229,72,77,0.08)] border border-[rgba(229,72,77,0.25)] flex items-start gap-2.5 text-[#e5484d] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-sans leading-relaxed flex-1">{errorMessage}</p>
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[460px] min-h-[300px]">
        {messages.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto text-[#d97706]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif text-base font-normal text-[var(--text-primary)]">
                Ask anything about your coursework
              </h4>
              <p className="font-sans text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1">
                Your AI study companion is ready to clarify concepts, break down
                complex ideas, and help you prepare for sessions.
              </p>
            </div>

            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="p-2.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-left font-sans cursor-pointer"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <AskAiMessageItem key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-[var(--border-hairline)] bg-[var(--bg-inset)] flex items-center gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask a study question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="p-2.5 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer flex items-center justify-center shrink-0"
          title="Send message"
        >
          {isStreaming ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
