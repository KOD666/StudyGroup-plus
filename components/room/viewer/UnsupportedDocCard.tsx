"use client";

import React from "react";
import { FileText, Download } from "lucide-react";

interface UnsupportedDocCardProps {
  title: string;
  fileType?: string;
  downloadUrl?: string;
}

export function UnsupportedDocCard({
  title,
  fileType,
  downloadUrl,
}: UnsupportedDocCardProps) {
  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-8 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto text-[var(--text-secondary)]">
          <FileText className="w-6 h-6" />
        </div>

        <div>
          <h4 className="font-serif text-lg font-normal text-[var(--text-primary)]">
            {title}
          </h4>
          <p className="font-mono text-xs text-[var(--text-secondary)] mt-1">
            {fileType ? `${fileType.toUpperCase()} Slide Deck` : "Document"}
          </p>
        </div>

        <p className="font-sans text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
          In-browser preview is not available for this format. You can download
          the file to view it locally.
        </p>

        {downloadUrl && (
          <div className="pt-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] hover:opacity-90 font-mono text-xs transition-opacity"
            >
              <Download className="w-4 h-4" /> Download Presentation
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
