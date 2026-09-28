"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";

interface ArrowHoverProps {
  className?: string;
  size?: number;
  rotation?: number; // degree rotation offset
}

/**
 * Diagonal Sliding Arrow Hover directly inspired by ainsley.dev's `.arrow-hover` (`pn` class):
 * - Visible arrow slides out along its diagonal axis
 * - Hidden duplicate arrow seamlessly slides in from the opposite side
 * - Fluid cubic-bezier transition [0.16, 1, 0.3, 1]
 */
export function ArrowHover({
  className = "",
  size = 18,
  rotation = 0,
}: ArrowHoverProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden group/arrow align-middle select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Primary visible arrow: slides up-right on hover */}
      <span
        className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/arrow:translate-x-full group-hover/arrow:-translate-y-full group-hover/arrow:opacity-0"
        style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
      >
        <ArrowUpRight className="w-full h-full stroke-[2.2]" />
      </span>

      {/* Incoming hidden arrow: enters from bottom-left on hover */}
      <span
        className="absolute inset-0 flex items-center justify-center -translate-x-full translate-y-full opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/arrow:translate-x-0 group-hover/arrow:translate-y-0 group-hover/arrow:opacity-100"
        style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
      >
        <ArrowUpRight className="w-full h-full stroke-[2.2]" />
      </span>
    </span>
  );
}
