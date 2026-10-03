"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Download,
  ArrowLeft,
  X,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ViewerControlsProps {
  title: string;
  fileType?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  zoom: number;
  isFitWidth: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFitWidth: () => void;
  onResetZoom: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  downloadUrl?: string;
  onClose: () => void;
}

export function ViewerControls({
  title,
  fileType,
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  isFitWidth,
  onZoomIn,
  onZoomOut,
  onToggleFitWidth,
  onResetZoom,
  isFullscreen,
  onToggleFullscreen,
  downloadUrl,
  onClose,
}: ViewerControlsProps) {
  const showPagination = typeof totalPages === "number" && totalPages > 1;

  return (
    <div className="h-12 px-4 border-b border-[var(--border-hairline)] bg-[var(--bg-inset)] flex items-center justify-between gap-3 shrink-0 select-none">
      {/* Left: Return to Stage & Title */}
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
            {fileType?.toUpperCase() || "DOC"}
          </span>
          <h3 className="font-serif text-sm font-normal text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
            {title}
          </h3>
        </div>
      </div>

      {/* Center: Page Navigation (if multi-page document like PDF) */}
      {showPagination && currentPage && onPageChange && (
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] font-mono text-xs text-[var(--text-primary)]">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-0.5 rounded hover:bg-[var(--bg-inset)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Previous page (Left Arrow)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-1 text-[0.6875rem]">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-0.5 rounded hover:bg-[var(--bg-inset)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Next page (Right Arrow)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Right: Zoom, Fit Width, Download, Fullscreen, Close */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Zoom controls */}
        <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] font-mono text-xs">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
            className="p-1 rounded hover:bg-[var(--bg-inset)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Zoom out (Ctrl + -)"
          >
            <ZoomOut className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>

          <button
            type="button"
            onClick={onResetZoom}
            className="px-1 text-[0.6875rem] text-[var(--text-primary)] hover:underline cursor-pointer"
            title="Reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={onZoomIn}
            disabled={zoom >= 3.0}
            className="p-1 rounded hover:bg-[var(--bg-inset)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Zoom in (Ctrl + +)"
          >
            <ZoomIn className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Fit to width */}
        <button
          type="button"
          onClick={onToggleFitWidth}
          className={`p-1.5 rounded-[var(--radius-button)] border text-xs font-mono transition-colors cursor-pointer ${
            isFitWidth
              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
          }`}
          title="Fit to width"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Download */}
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center"
            title="Download original file"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Fullscreen on meeting stage container */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title={
            isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen meeting stage"
          }
        >
          {isFullscreen ? (
            <Minimize className="w-3.5 h-3.5" />
          ) : (
            <Maximize className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Close Document */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer ml-1"
          title="Close document viewer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
