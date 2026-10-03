"use client";

import { useState, useCallback, useEffect } from "react";

export function useViewerZoom(initialZoom = 1.0) {
  const [zoom, setZoomState] = useState<number>(initialZoom);
  const [isFitWidth, setIsFitWidth] = useState<boolean>(false);

  const zoomIn = useCallback(() => {
    setIsFitWidth(false);
    setZoomState((prev) =>
      Math.min(3.0, Math.round((prev + 0.15) * 100) / 100)
    );
  }, []);

  const zoomOut = useCallback(() => {
    setIsFitWidth(false);
    setZoomState((prev) =>
      Math.max(0.5, Math.round((prev - 0.15) * 100) / 100)
    );
  }, []);

  const resetZoom = useCallback(() => {
    setIsFitWidth(false);
    setZoomState(1.0);
  }, []);

  const toggleFitWidth = useCallback(() => {
    setIsFitWidth((prev) => !prev);
  }, []);

  const setZoom = useCallback((newZoom: number) => {
    setIsFitWidth(false);
    setZoomState(Math.max(0.5, Math.min(3.0, newZoom)));
  }, []);

  // Keyboard zoom shortcuts (+ / - / 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomIn, zoomOut, resetZoom]);

  return {
    zoom,
    isFitWidth,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleFitWidth,
    setZoom,
  };
}
