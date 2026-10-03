"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Room } from "livekit-client";
import { Loader2, AlertCircle } from "lucide-react";
import {
  useCursorSender,
  useCursorReceiver,
  DocumentCursorOverlay,
} from "./cursors";
import "./pdfTextLayer.css";

interface PdfViewerProps {
  url: string;
  docId: string | null;
  currentPage: number;
  onPageChange: (page: number, total: number) => void;
  zoom: number;
  isFitWidth: boolean;
  room: Room | null;
  currentUserId?: string;
}

export function PdfViewer({
  url,
  docId,
  currentPage,
  onPageChange,
  zoom,
  isFitWidth,
  room,
  currentUserId,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const onPageChangeRef = useRef(onPageChange);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);

  // Live Cursors
  useCursorSender({
    room,
    docId,
    pageNumber: currentPage,
    containerRef,
  });

  const cursors = useCursorReceiver({
    room,
    currentDocId: docId,
    currentPageNumber: currentPage,
    currentUserId,
  });

  // Load PDF document using self-hosted worker
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument({
          url,
          withCredentials: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        onPageChangeRef.current(1, doc.numPages);
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error("Failed to load PDF:", err);
          setError("Could not load PDF document.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadPdf();
    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Render current page canvas and text layer
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const textLayerDiv = textLayerRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const unscaledViewport = page.getViewport({ scale: 1.0 });
      let computedScale = zoom;

      if (isFitWidth && containerRef.current?.parentElement) {
        const parentWidth = containerRef.current.parentElement.clientWidth - 48;
        if (parentWidth > 0 && unscaledViewport.width > 0) {
          computedScale = parentWidth / unscaledViewport.width;
        }
      }

      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: computedScale });

      // Configure canvas with device pixel ratio for sharp rendering
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      ctx.save();
      ctx.scale(dpr, dpr);

      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas,
      };

      await page.render(renderContext).promise;
      ctx.restore();

      // Clear previous text layer and render new text layer for selection
      textLayerDiv.innerHTML = "";
      textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
      textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

      const pdfjs = await import("pdfjs-dist");
      if (pdfjs.TextLayer) {
        const textContent = await page.getTextContent();
        const textLayer = new pdfjs.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        });
        await textLayer.render();
      }
    } catch (renderErr) {
      console.warn("PDF page render error:", renderErr);
    }
  }, [pdfDoc, currentPage, zoom, isFitWidth]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Keyboard navigation (Left / Right / PageUp / PageDown)
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      )
        return;

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (pdfDoc && currentPage < pdfDoc.numPages) {
          onPageChange(currentPage + 1, pdfDoc.numPages);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (currentPage > 1 && pdfDoc) {
          onPageChange(currentPage - 1, pdfDoc.numPages);
        }
      }
    };

    window.addEventListener("keydown", handleKeyNav);
    return () => window.removeEventListener("keydown", handleKeyNav);
  }, [pdfDoc, currentPage, onPageChange]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-[var(--text-secondary)]">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        <span className="font-mono text-xs">Loading PDF document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-[#e5484d]" />
        <p className="font-serif text-sm text-[var(--text-primary)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4 min-w-full">
      <div
        ref={containerRef}
        className="relative bg-white shadow-md border border-[var(--border-hairline)] rounded-sm overflow-hidden select-text"
      >
        <canvas ref={canvasRef} className="block" />
        <div ref={textLayerRef} className="pdf-text-layer" />
        <DocumentCursorOverlay cursors={cursors} />
      </div>
    </div>
  );
}
