"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

/**
 * Editorial Frosted-Glass Blur Cursor:
 * - Replaces solid white circle with an elegant, translucent backdrop-blur lens
 * - Snappy 6px center dot for high-precision targeting
 * - Trailing frosted lens with fluid spring physics
 * - Smoothly expands on hover over interactive elements with delicate border illumination
 * - Displays contextual uppercase label when hovering elements with [data-cursor-text]
 * - Magnetic attraction to [data-magnetic] targets
 * - Touch-safe: auto-disabled on touchscreen/mobile and prefers-reduced-motion
 */
export function CustomCursor() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorText, setCursorText] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Mouse coordinate values
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Snappy spring for center dot
  const dotSpringX = useSpring(mouseX, { damping: 40, stiffness: 700, mass: 0.1 });
  const dotSpringY = useSpring(mouseY, { damping: 40, stiffness: 700, mass: 0.1 });

  // Fluid trailing spring for the outer blur lens
  const lensSpringX = useSpring(mouseX, { damping: 26, stiffness: 280, mass: 0.4 });
  const lensSpringY = useSpring(mouseY, { damping: 26, stiffness: 280, mass: 0.4 });

  const activeMagneticRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Only enable on desktop with fine pointer and no reduced motion
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!finePointer || reducedMotion) {
      setIsEnabled(false);
      return;
    }

    setIsEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      mouseX.set(clientX);
      mouseY.set(clientY);
      if (!isVisible) setIsVisible(true);

      // Handle magnetic pull for elements with [data-magnetic] or .magnetic-cta
      const target = (e.target as HTMLElement)?.closest?.(
        "[data-magnetic], .magnetic-cta"
      ) as HTMLElement | null;

      if (target) {
        activeMagneticRef.current = target;
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < 48) {
          const maxPull = 8;
          const pullX = Math.max(-maxPull, Math.min(maxPull, dx * 0.18));
          const pullY = Math.max(-maxPull, Math.min(maxPull, dy * 0.18));
          target.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
          target.style.transition = "transform 100ms cubic-bezier(0.16, 1, 0.3, 1)";
        } else {
          target.style.transform = "translate3d(0px, 0px, 0)";
          target.style.transition = "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        }
      } else if (activeMagneticRef.current) {
        activeMagneticRef.current.style.transform = "translate3d(0px, 0px, 0)";
        activeMagneticRef.current.style.transition = "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        activeMagneticRef.current = null;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactive = target.closest(
        'a, button, input, textarea, select, [role="button"], [tabindex], .interactive, [data-magnetic], [data-cursor-invert], .cursor-element, [data-cursor-scale]'
      );

      if (interactive) {
        setIsHovered(true);
        const text = interactive.getAttribute("data-cursor-text");
        setCursorText(text || null);
      } else {
        setIsHovered(false);
        setCursorText(null);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      if (activeMagneticRef.current) {
        activeMagneticRef.current.style.transform = "translate3d(0px, 0px, 0)";
        activeMagneticRef.current = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (activeMagneticRef.current) {
        activeMagneticRef.current.style.transform = "translate3d(0px, 0px, 0)";
      }
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isEnabled || !isVisible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Center 6px solid precision dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.6)] pointer-events-none"
        style={{
          x: dotSpringX,
          y: dotSpringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* Trailing Translucent Frosted-Glass Blur Lens (replaces solid white circle) */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border pointer-events-none flex items-center justify-center text-center overflow-hidden"
        style={{
          x: lensSpringX,
          y: lensSpringY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovered ? (cursorText ? 64 : 48) : 28,
          height: isHovered ? (cursorText ? 64 : 48) : 28,
          scale: isHovered ? 1.15 : 1,
          backgroundColor: isHovered ? "rgba(255, 255, 255, 0.09)" : "rgba(255, 255, 255, 0.03)",
          borderColor: isHovered ? "rgba(255, 255, 255, 0.40)" : "rgba(255, 255, 255, 0.18)",
          backdropFilter: isHovered ? "blur(8px)" : "blur(2px)",
        }}
        transition={{
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {cursorText && (
          <span className="font-mono text-[9px] font-medium tracking-widest uppercase text-white/90 select-none px-1">
            {cursorText}
          </span>
        )}
      </motion.div>
    </div>
  );
}
