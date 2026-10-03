"use client";

import React, { useState, useEffect } from "react";
import { Room } from "livekit-client";
import { ActiveMeetingDoc } from "./types";
import { useViewerZoom } from "./useViewerZoom";
import { ViewerControls } from "./ViewerControls";
import { PdfViewer } from "./PdfViewer";
import { MarkdownViewer } from "./MarkdownViewer";
import { PlainTextViewer } from "./PlainTextViewer";
import { ImageViewer } from "./ImageViewer";
import { UnsupportedDocCard } from "./UnsupportedDocCard";
import { Button } from "@/components/ui/Button";
import { Pin, BookOpen, Copy, Check } from "lucide-react";

interface CustomDocViewerProps {
  doc: ActiveMeetingDoc;
  room: Room | null;
  currentUserId?: string;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onUpdateNote?: (noteId: string, newText: string) => void;
}

export function CustomDocViewer({
  doc,
  room,
  currentUserId,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  onUpdateNote,
}: CustomDocViewerProps) {
  const { zoom, isFitWidth, zoomIn, zoomOut, resetZoom, toggleFitWidth } =
    useViewerZoom(1.0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rawContent, setRawContent] = useState<string>(doc.content || "");
  const [copied, setCopied] = useState(false);
  const [isSavedNote, setIsSavedNote] = useState(false);

  // Asset route URL for raw streaming
  const assetId = doc.assetId || doc.id;
  const rawUrl = doc.rawUrl || (assetId ? `/api/assets/${assetId}/raw` : "");
  const downloadUrl =
    doc.downloadUrl ||
    (assetId ? `/api/assets/${assetId}/raw?download=true` : "");

  const fileType = (doc.fileType || "").toLowerCase();
  const isPdf = fileType === "pdf";
  const isMd = fileType === "md" || fileType === "markdown";
  const isPptx = fileType === "pptx" || fileType === "ppt";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(
    fileType
  );

  // Fetch raw content for Markdown or Text documents if not supplied in doc.content
  useEffect(() => {
    if (!(
      doc.type === "doc" &&
      (isMd || fileType === "txt") &&
      rawUrl &&
      !doc.content
    )) {
      return undefined;
    }
    let isCancelled = false;
    fetch(rawUrl)
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        if (!isCancelled) setRawContent(text);
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [doc.type, isMd, fileType, rawUrl, doc.content]);

  function handleCopy(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSaveNote() {
    if (doc.id && onUpdateNote) {
      onUpdateNote(doc.id, rawContent);
      setIsSavedNote(true);
      setTimeout(() => setIsSavedNote(false), 2000);
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] overflow-hidden shadow-sm">
      {/* Header and Controls Bar */}
      <ViewerControls
        title={doc.title}
        fileType={
          doc.type === "note"
            ? "NOTE"
            : doc.type === "citation"
              ? "CITATION"
              : doc.fileType
        }
        currentPage={isPdf ? currentPage : undefined}
        totalPages={isPdf ? totalPages : undefined}
        onPageChange={(page) => setCurrentPage(page)}
        zoom={zoom}
        isFitWidth={isFitWidth}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onToggleFitWidth={toggleFitWidth}
        onResetZoom={resetZoom}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        downloadUrl={downloadUrl}
        onClose={onClose}
      />

      {/* Main Viewer Body */}
      <div className="flex-1 overflow-auto bg-[var(--bg-primary)] flex flex-col relative select-text">
        {doc.type === "doc" && (
          <>
            {isPdf && rawUrl && (
              <PdfViewer
                url={rawUrl}
                docId={doc.id || "pdf-doc"}
                currentPage={currentPage}
                onPageChange={(curr, total) => {
                  setCurrentPage(curr);
                  setTotalPages(total);
                }}
                zoom={zoom}
                isFitWidth={isFitWidth}
                room={room}
                currentUserId={currentUserId}
              />
            )}

            {isMd && (
              <MarkdownViewer
                content={rawContent}
                docId={doc.id || "md-doc"}
                zoom={zoom}
                room={room}
                currentUserId={currentUserId}
              />
            )}

            {isPptx && (
              <UnsupportedDocCard
                title={doc.title}
                fileType={doc.fileType}
                downloadUrl={downloadUrl}
              />
            )}

            {isImage && rawUrl && (
              <ImageViewer
                url={rawUrl}
                title={doc.title}
                docId={doc.id || "img-doc"}
                zoom={zoom}
                room={room}
                currentUserId={currentUserId}
              />
            )}

            {!isPdf && !isMd && !isPptx && !isImage && (
              <PlainTextViewer
                content={rawContent || doc.content || "Empty document"}
                docId={doc.id || "txt-doc"}
                zoom={zoom}
                room={room}
                currentUserId={currentUserId}
              />
            )}
          </>
        )}

        {doc.type === "note" && (
          <div className="max-w-2xl mx-auto w-full my-6 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-[var(--text-primary)]" />
                <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                  Study Note
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={
                  copied ? (
                    <Check className="w-3.5 h-3.5 text-[#10b981]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                onClick={() => handleCopy(rawContent)}
                className="text-xs"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              rows={10}
              placeholder="Write study notes here..."
              className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] p-3 text-sm font-serif italic text-[var(--text-primary)] leading-relaxed outline-none focus:border-[var(--border-focus)] transition-colors resize-y"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                {rawContent.length} characters
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
          <div className="max-w-2xl mx-auto w-full my-6 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-hairline)]">
              <BookOpen className="w-4 h-4 text-[var(--text-primary)]" />
              <span className="font-mono text-xs uppercase text-[var(--text-secondary)]">
                Citation
              </span>
            </div>
            <div className="p-4 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)]">
              <p className="font-serif italic text-base text-[var(--text-primary)] leading-relaxed">
                {doc.citationText}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                Source: {doc.title}
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={
                  copied ? (
                    <Check className="w-3.5 h-3.5 text-[#10b981]" />
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
