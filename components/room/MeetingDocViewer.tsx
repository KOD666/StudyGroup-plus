"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  X,
  Download,
  Copy,
  Check,
  FileText,
  ExternalLink,
  BookOpen,
  Pin,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ActiveMeetingDoc {
  type: "doc" | "note" | "citation";
  id?: string;
  title: string;
  fileType?: string;
  downloadUrl?: string;
  content?: string;
  citationText?: string;
}

interface MeetingDocViewerProps {
  doc: ActiveMeetingDoc;
  onClose: () => void;
  onUpdateNote?: (noteId: string, newText: string) => void;
  onPopOutVideo?: () => void;
  hasDocPiPSupport?: boolean;
}

export function MeetingDocViewer({
  doc,
  onClose,
  onUpdateNote,
  onPopOutVideo,
  hasDocPiPSupport = false,
}: MeetingDocViewerProps) {
  const [copied, setCopied] = useState(false);
  const [noteContent, setNoteContent] = useState(doc.content || "");
  const [isSavedNote, setIsSavedNote] = useState(false);

  function handleCopy(text: string) {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveNote() {
    if (doc.id && onUpdateNote) {
      onUpdateNote(doc.id, noteContent);
      setIsSavedNote(true);
      setTimeout(() => setIsSavedNote(false), 2000);
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-12 px-4 border-b border-[var(--border-hairline)] bg-[var(--bg-inset)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={onClose}
            className="text-xs shrink-0"
            title="Return to Camera Stage"
          >
            Stage
          </Button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] font-mono text-[0.625rem] text-[var(--text-secondary)] uppercase shrink-0">
              {doc.type === "doc"
                ? doc.fileType?.toUpperCase() || "DOCUMENT"
                : doc.type === "note"
                  ? "STUDY NOTE"
                  : "CITATION"}
            </span>
            <h3 className="font-serif text-sm font-normal text-[var(--text-primary)] truncate">
              {doc.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {doc.type === "citation" && doc.citationText && (
            <Button
              variant="secondary"
              size="sm"
              icon={
                copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
              onClick={() => handleCopy(doc.citationText || "")}
              className="text-xs"
            >
              {copied ? "Copied" : "Copy Citation"}
            </Button>
          )}

          {doc.type === "doc" && doc.downloadUrl && (
            <a
              href={doc.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] text-xs font-mono text-[var(--text-primary)] transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}

          {hasDocPiPSupport && onPopOutVideo && (
            <button
              type="button"
              onClick={onPopOutVideo}
              className="p-1.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Pop out camera into always-on-top window (Picture-in-Picture)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
            title="Close document and return to camera stage"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[var(--bg-primary)]">
        {doc.type === "doc" && (
          <div className="h-full w-full flex flex-col">
            {doc.fileType?.toLowerCase() === "pdf" && doc.downloadUrl ? (
              <div className="flex-1 w-full h-full min-h-[500px] rounded-[var(--radius-button)] overflow-hidden border border-[var(--border-hairline)] bg-white">
                <iframe
                  src={doc.downloadUrl}
                  className="w-full h-full border-0"
                  title={doc.title}
                />
              </div>
            ) : doc.content ? (
              <div className="max-w-3xl mx-auto w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 sm:p-8">
                <pre className="font-sans text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
                  {doc.content}
                </pre>
              </div>
            ) : (
              <div className="max-w-md mx-auto w-full my-auto text-center p-8 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] space-y-4">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto text-[var(--text-primary)]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-lg text-[var(--text-primary)]">
                    {doc.title}
                  </h4>
                  <p className="font-mono text-xs text-[var(--text-secondary)] mt-1">
                    {doc.fileType?.toUpperCase()} document
                  </p>
                </div>
                {doc.downloadUrl && (
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] hover:opacity-90 font-mono text-xs transition-opacity"
                  >
                    <Download className="w-4 h-4" /> Download to View
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {doc.type === "note" && (
          <div className="max-w-2xl mx-auto w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-[var(--text-primary)]" />
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                  In-Meeting Study Note
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={
                  copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                onClick={() => handleCopy(noteContent)}
                className="text-xs"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={8}
              placeholder="Write or edit study note..."
              className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] p-3 text-sm font-serif italic text-[var(--text-primary)] leading-relaxed placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors resize-y"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                {noteContent.length} characters
              </span>
              {onUpdateNote && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNote}
                  icon={
                    isSavedNote ? <Check className="w-3.5 h-3.5" /> : undefined
                  }
                  className="text-xs"
                >
                  {isSavedNote ? "Note Saved" : "Save Note"}
                </Button>
              )}
            </div>
          </div>
        )}

        {doc.type === "citation" && (
          <div className="max-w-2xl mx-auto w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-hairline)]">
              <BookOpen className="w-4 h-4 text-[var(--text-primary)]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                Bibliographic Citation
              </span>
            </div>

            <div className="p-4 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)]">
              <p className="font-serif italic text-base sm:text-lg text-[var(--text-primary)] leading-relaxed">
                {doc.citationText}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                Source Document: {doc.title}
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={
                  copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                onClick={() => handleCopy(doc.citationText || "")}
                className="text-xs"
              >
                {copied ? "Copied" : "Copy Reference"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
