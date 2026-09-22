"use client";

import React, { useRef } from "react";
import { motion, useSpring, useReducedMotion } from "framer-motion";

interface MagneticSkewProps {
  children: React.ReactNode;
  className?: string;
  transformFactor?: number; // Distance translate multiplier (default: 0.12)
  rotateFactor?: number; // 3D rotate tilt multiplier (default: 0.08)
  shouldRotate?: boolean; // Enable 3D tilt (default: true)
  disabled?: boolean;
}

/**
 * 3D Magnetic Skew & Tilt Component directly inspired by ainsley.dev's `.skew` class:
 * - Computes relative offset from element center (dx, dy)
 * - Applies smooth GPU-accelerated 3D tilt (rotateX, rotateY) and translation (x, y)
 * - Returns with damped spring physics on mouse leave
 * - Respects prefers-reduced-motion
 */
export function MagneticSkew({
  children,
  className = "",
  transformFactor = 0.12,
  rotateFactor = 0.08,
  shouldRotate = true,
  disabled = false,
}: MagneticSkewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Springs for silky physics
  const springX = useSpring(0, { stiffness: 320, damping: 24, mass: 0.4 });
  const springY = useSpring(0, { stiffness: 320, damping: 24, mass: 0.4 });
  const springRotateX = useSpring(0, { stiffness: 280, damping: 24, mass: 0.4 });
  const springRotateY = useSpring(0, { stiffness: 280, damping: 24, mass: 0.4 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || shouldReduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    springX.set(dx * transformFactor);
    springY.set(dy * transformFactor);

    if (shouldRotate) {
      // Tilts toward cursor: negative dy rotates along X axis
      springRotateX.set(-dy * rotateFactor);
      springRotateY.set(dx * rotateFactor);
    }
  };

  const handleMouseLeave = () => {
    springX.set(0);
    springY.set(0);
    springRotateX.set(0);
    springRotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: shouldReduceMotion ? 0 : springX,
        y: shouldReduceMotion ? 0 : springY,
        rotateX: shouldReduceMotion ? 0 : springRotateX,
        rotateY: shouldReduceMotion ? 0 : springRotateY,
        transformStyle: "preserve-3d",
      }}
      className={`perspective-[1000px] will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}
