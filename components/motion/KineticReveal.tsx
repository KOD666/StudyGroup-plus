"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface KineticRevealProps {
  text: string;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  delay?: number;
}

/**
 * Word-by-word Mask Reveal Component inspired by ainsley.dev:
 * - Each word sweeps upward from behind an invisible overflow:hidden baseline mask
 * - Staggered exponential easing [0.16, 1, 0.3, 1]
 * - Defaults to inline <span> to avoid invalid nested heading (h1/h2) DOM hierarchies
 * - Instant fallback when prefers-reduced-motion is active
 */
export function KineticReveal({
  text,
  as = "span",
  className = "",
  delay = 0,
}: KineticRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(" ");
  const Tag = as;

  if (shouldReduceMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={`inline-flex flex-wrap gap-x-[0.26em] ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden py-0.5">
          <motion.span
            initial={{ y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: delay + i * 0.045,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block will-change-transform"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
