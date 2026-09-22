"use client";

import React, { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface CardSpotlightProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Subtle red accent glow
  borderColor?: string;
}

/**
 * Card Spotlight Component inspired by ainsley.dev's `.card-clip`:
 * - Tracks mouse coordinates inside card boundaries
 * - Casts dynamic radial spotlight and border illumination beneath cursor
 * - Enhances depth without noisy drop-shadows
 */
export function CardSpotlight({
  children,
  className = "",
  glowColor = "rgba(239, 70, 57, 0.09)",
  borderColor = "rgba(239, 70, 57, 0.35)",
}: CardSpotlightProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden group/spotlight ${className}`}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      {!shouldReduceMotion && (
        <>
          <div
            className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover/spotlight:opacity-100 z-10"
            style={{
              background: `radial-gradient(320px circle at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 80%)`,
            }}
          />
          <div
            className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 opacity-0 group-hover/spotlight:opacity-100 z-10"
            style={{
              background: `radial-gradient(200px circle at ${coords.x}px ${coords.y}px, ${borderColor}, transparent 80%)`,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "1px",
            }}
          />
        </>
      )}
      {children}
    </div>
  );
}
