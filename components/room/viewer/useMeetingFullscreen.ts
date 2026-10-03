"use client";

import { useState, useEffect, useCallback } from "react";

export function useMeetingFullscreen(
  stageContainerRef: React.RefObject<HTMLElement | null>
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = Boolean(
        document.fullscreenElement &&
        stageContainerRef.current &&
        (document.fullscreenElement === stageContainerRef.current ||
          stageContainerRef.current.contains(document.fullscreenElement))
      );
      setIsFullscreen(isNowFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [stageContainerRef]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (stageContainerRef.current) {
        await stageContainerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  }, [stageContainerRef]);

  return {
    isFullscreen,
    toggleFullscreen,
  };
}
