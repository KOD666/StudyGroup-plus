"use client";

import React, { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Room } from "livekit-client";
import {
  useCursorSender,
  useCursorReceiver,
  DocumentCursorOverlay,
} from "./cursors";

interface MarkdownViewerProps {
  content: string;
  docId: string | null;
  zoom: number;
  room: Room | null;
  currentUserId?: string;
}

export function MarkdownViewer({
  content,
  docId,
  zoom,
  room,
  currentUserId,
}: MarkdownViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Live cursor integration on Markdown doc (page 1)
  useCursorSender({
    room,
    docId,
    pageNumber: 1,
    containerRef,
  });

  const cursors = useCursorReceiver({
    room,
    currentDocId: docId,
    currentPageNumber: 1,
    currentUserId,
  });

  return (
    <div className="w-full flex justify-center p-4">
      <div
        ref={containerRef}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
        }}
        className="relative max-w-3xl w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 sm:p-10 shadow-sm transition-transform duration-75"
      >
        <div className="prose prose-sm dark:prose-invert max-w-none font-sans text-xs leading-relaxed text-[var(--text-primary)]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Force checkboxes to be read-only
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              input: ({ node, ...props }) => {
                if (props.type === "checkbox") {
                  return (
                    <input
                      {...props}
                      disabled
                      readOnly
                      className="rounded border-[var(--border-hairline)] mr-1.5 cursor-not-allowed"
                    />
                  );
                }
                return <input {...props} />;
              },
              h1: ({ children }) => (
                <h1 className="font-serif text-2xl font-normal border-b border-[var(--border-hairline)] pb-2 mb-4 text-[var(--text-primary)]">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="font-serif text-lg font-normal mt-6 mb-3 text-[var(--text-primary)]">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="font-serif text-base font-normal mt-4 mb-2 text-[var(--text-primary)]">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 leading-relaxed text-[var(--text-primary)]">
                  {children}
                </p>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="px-1.5 py-0.5 rounded bg-[var(--bg-inset)] font-mono text-[11px] text-[var(--text-primary)] border border-[var(--border-hairline)]">
                    {children}
                  </code>
                ) : (
                  <pre className="p-3 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] overflow-x-auto font-mono text-xs my-3">
                    <code>{children}</code>
                  </pre>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-[var(--border-hover)] pl-3 italic text-[var(--text-secondary)] my-3">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4 border border-[var(--border-hairline)] rounded-[var(--radius-button)]">
                  <table className="w-full text-left text-xs border-collapse">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="p-2 border-b border-[var(--border-hairline)] bg-[var(--bg-inset)] font-mono font-medium text-[var(--text-secondary)]">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="p-2 border-b border-[var(--border-hairline)] text-[var(--text-primary)]">
                  {children}
                </td>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        <DocumentCursorOverlay cursors={cursors} />
      </div>
    </div>
  );
}
