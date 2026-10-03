"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Sparkles, User } from "lucide-react";
import { AiChatMessage } from "./types";

interface AskAiMessageItemProps {
  message: AiChatMessage;
}

export function AskAiMessageItem({ message }: AskAiMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  function handleCopy() {
    if (!message.content) return;
    navigator.clipboard?.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`flex flex-col space-y-1.5 ${
        isAssistant ? "items-start" : "items-end"
      }`}
    >
      <div className="flex items-center gap-1.5 text-[0.6875rem] font-mono text-[var(--text-secondary)]">
        {isAssistant ? (
          <>
            <Sparkles className="w-3 h-3 text-[#d97706]" />
            <span className="font-medium text-[var(--text-primary)]">
              Study Assistant
            </span>
          </>
        ) : (
          <>
            <span className="font-medium text-[var(--text-primary)]">You</span>
            <User className="w-3 h-3 text-[var(--text-secondary)]" />
          </>
        )}
        <span>{message.timestamp}</span>
      </div>

      <div
        className={`p-3.5 rounded-[var(--radius-card)] text-xs leading-relaxed max-w-[90%] sm:max-w-[85%] relative group ${
          isAssistant
            ? "bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--border-hairline)]"
            : "bg-[var(--invert-bg)] text-[var(--invert-text)] font-sans"
        }`}
      >
        {isAssistant ? (
          <div className="prose prose-xs dark:prose-invert max-w-none font-sans text-xs">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Prevent rendering raw HTML
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-4 mb-2 space-y-1">
                    {children}
                  </ol>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="px-1 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] font-mono text-[11px]">
                      {children}
                    </code>
                  ) : (
                    <pre className="p-2.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)] overflow-x-auto font-mono text-[11px] my-2">
                      <code>{children}</code>
                    </pre>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Copy button for assistant responses */}
            <div className="pt-2 border-t border-[var(--border-hairline)]/60 mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!message.content}
                className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-[#10b981]" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
}
