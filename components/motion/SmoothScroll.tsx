"use client";

import React, { useEffect } from "react";

/**
 * Inertia scroll physics per DESIGN.md §4:
 * - Lenis-style lerp 0.1, wheel multiplier 1
 * - Applied to long panels (Dashboard, Group Workspace document grid, Asset Viewer reading column)
 * - Live/real-time panels (chat, transcript) use native browser scroll with momentum only
 * - Fully disabled if prefers-reduced-motion: reduce
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    // We attach an inertially interpolated wheel listener to scrollable elements with [data-inertia-scroll]
    const activeScrolls = new Map<
      HTMLElement,
      { targetY: number; currentY: number; rafId: number | null }
    >();

    const updateScroll = (el: HTMLElement) => {
      const state = activeScrolls.get(el);
      if (!state) return;

      const diff = state.targetY - state.currentY;
      if (Math.abs(diff) > 0.5) {
        state.currentY += diff * 0.1; // lerp 0.1
        el.scrollTop = state.currentY;
        state.rafId = requestAnimationFrame(() => updateScroll(el));
      } else {
        el.scrollTop = state.targetY;
        state.currentY = state.targetY;
        state.rafId = null;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Find closest scroll container that has data-inertia-scroll or is the window/main scroll
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Real-time panels (chat, transcript) use native browser scroll only
      if (target.closest("[data-native-scroll], .native-scroll, #chat-panel, #transcript-panel")) {
        return;
      }

      const container = target.closest<HTMLElement>("[data-inertia-scroll]");
      if (!container) return;

      // If container can scroll vertically
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;

      e.preventDefault();

      let state = activeScrolls.get(container);
      if (!state) {
        state = { targetY: container.scrollTop, currentY: container.scrollTop, rafId: null };
        activeScrolls.set(container, state);
      }

      // Wheel multiplier 1
      state.targetY = Math.max(0, Math.min(maxScroll, state.targetY + e.deltaY));

      if (state.rafId === null) {
        state.rafId = requestAnimationFrame(() => updateScroll(container));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      activeScrolls.forEach((state) => {
        if (state.rafId !== null) cancelAnimationFrame(state.rafId);
      });
      activeScrolls.clear();
    };
  }, []);

  return <>{children}</>;
}
