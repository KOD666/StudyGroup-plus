"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RouteTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Route transition per DESIGN.md §4:
 * - Full-bleed cross-fade through --bg-primary
 * - Incoming: fades in scaling 1.02 -> 1.0
 * - Duration: 550ms (--dur-page), ease: [0.65, 0, 0.35, 1] (--ease-in-out-soft)
 * - Reduced motion fallback: opacity only, 150ms
 */
export function RouteTransition({
  children,
  className = "",
}: RouteTransitionProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: shouldReduceMotion ? 1 : 1.02,
      }}
      animate={{
        opacity: 1,
        scale: 1.0,
      }}
      exit={{
        opacity: 0,
        scale: shouldReduceMotion ? 1 : 0.98,
      }}
      transition={{
        duration: shouldReduceMotion ? 0.15 : 0.55,
        ease: [0.65, 0, 0.35, 1],
      }}
      className={`w-full min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  );
}
