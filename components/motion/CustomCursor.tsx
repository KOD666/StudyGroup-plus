"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

/**
 * Custom cursor per DESIGN.md §4:
 * - 8px solid dot
 * - 32px trailing ring lagging via spring physics (~150ms settle)
 * - On interactive hover: scales to 48px + 10% opacity fill of --text-primary
 * - Magnetic CTA pull up to 6px within 40px radius
 * - Fine-pointer desktop only: `(hover: hover) and (pointer: fine)`
 * - Fully disabled if `prefers-reduced-motion: reduce`
 */
export function CustomCursor() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring physics for the trailing ring (~150ms settle)
  const springX = useSpring(mouseX, { damping: 26, stiffness: 280, mass: 0.4 });
  const springY = useSpring(mouseY, { damping: 26, stiffness: 280, mass: 0.4 });

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
      const clientX = e.clientX;
      const clientY = e.clientY;

      mouseX.set(clientX);
      mouseY.set(clientY);
      if (!isVisible) setIsVisible(true);

      // Handle magnetic pull for elements with [data-magnetic] or .magnetic-cta
      const target = (e.target as HTMLElement)?.closest?.("[data-magnetic], .magnetic-cta") as HTMLElement | null;
      if (target) {
        activeMagneticRef.current = target;
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < 40) {
          const maxPull = 6;
          const pullX = Math.max(-maxPull, Math.min(maxPull, dx * 0.15));
          const pullY = Math.max(-maxPull, Math.min(maxPull, dy * 0.15));
          target.style.transform = `translate(${pullX}px, ${pullY}px)`;
          target.style.transition = "transform 100ms cubic-bezier(0.16, 1, 0.3, 1)";
        } else {
          target.style.transform = "translate(0px, 0px)";
          target.style.transition = "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        }
      } else if (activeMagneticRef.current) {
        activeMagneticRef.current.style.transform = "translate(0px, 0px)";
        activeMagneticRef.current.style.transition = "transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)";
        activeMagneticRef.current = null;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive = target.closest(
        'a, button, input, textarea, select, [role="button"], [tabindex], .interactive, [data-magnetic]'
      );
      setIsHovered(Boolean(isInteractive));
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      if (activeMagneticRef.current) {
        activeMagneticRef.current.style.transform = "translate(0px, 0px)";
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
        activeMagneticRef.current.style.transform = "translate(0px, 0px)";
      }
    };
  }, [isVisible, mouseX, mouseY]);

  if (!isEnabled || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-99999 overflow-hidden">
      {/* Center 8px solid dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-[#ededed] pointer-events-none"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />

      {/* Trailing 32px ring (expands to 48px with 10% fill on hover) */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border border-[rgba(237,237,237,0.35)] pointer-events-none"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovered ? 48 : 32,
          height: isHovered ? 48 : 32,
          backgroundColor: isHovered ? "rgba(237, 237, 237, 0.10)" : "rgba(237, 237, 237, 0)",
          borderColor: isHovered ? "rgba(237, 237, 237, 0.55)" : "rgba(237, 237, 237, 0.28)",
        }}
        transition={{
          duration: 0.2,
          ease: [0.25, 1, 0.5, 1],
        }}
      />
    </div>
  );
}
