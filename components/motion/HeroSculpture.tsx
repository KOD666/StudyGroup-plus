"use client";

import React, { useRef, useEffect } from "react";
import { motion, useSpring, useReducedMotion } from "framer-motion";

/**
 * Interactive 3D Sculptural Prism directly inspired by ainsley.dev's hero `.home-three-d`:
 * - Intersecting geometric facets with coral/red (#ef4639), deep charcoal, and translucent planes
 * - Tilts and reacts to cursor position with 3D perspective
 * - Breathing ambient float animation
 * - Touch-safe & reduced motion compliant
 */
export function HeroSculpture({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const springRotateX = useSpring(0, { stiffness: 120, damping: 20 });
  const springRotateY = useSpring(0, { stiffness: 120, damping: 20 });
  const springTranslateZ = useSpring(0, { stiffness: 120, damping: 20 });

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);

      springRotateX.set(-y * 18);
      springRotateY.set(x * 22);
      springTranslateZ.set(Math.abs(x * y) * 30);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [shouldReduceMotion, springRotateX, springRotateY, springTranslateZ]);

  return (
    <div
      ref={containerRef}
      className={`relative perspective-[1200px] pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : springRotateX,
          rotateY: shouldReduceMotion ? 0 : springRotateY,
          z: shouldReduceMotion ? 0 : springTranslateZ,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-square max-w-[420px] mx-auto flex items-center justify-center animate-float-slow"
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-none overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Red Accent Gradient matching ainsley.dev #ef4639 */}
            <linearGradient
              id="sculpture-red"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ef4639" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="0.8" />
            </linearGradient>

            {/* Charcoal / Elevated Inset Gradient */}
            <linearGradient
              id="sculpture-dark"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#222222" />
              <stop offset="100%" stopColor="#0d0d0d" />
            </linearGradient>

            {/* Translucent Frosted Glass Overlay */}
            <linearGradient
              id="sculpture-glass"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Deep Charcoal Rear Facet */}
          <polygon
            points="60,280 200,60 340,280"
            fill="url(#sculpture-dark)"
            stroke="rgba(237, 237, 237, 0.12)"
            strokeWidth="1"
          />

          {/* Bold Coral / Red Facet (The iconic ainsley.dev visual punch) */}
          <polygon
            points="200,60 340,280 250,340 160,220"
            fill="url(#sculpture-red)"
            stroke="#ef4639"
            strokeWidth="0.75"
            opacity="0.92"
          />

          {/* Translucent Front Overlap Prism */}
          <polygon
            points="60,280 160,220 250,340 110,330"
            fill="url(#sculpture-glass)"
            stroke="rgba(237, 237, 237, 0.25)"
            strokeWidth="1"
          />

          {/* Crisp Editorial Diagonal Axis Hairline */}
          <line
            x1="200"
            y1="60"
            x2="250"
            y2="340"
            stroke="#ededed"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Floating Live Pulse Accent Dot */}
          <circle
            cx="200"
            cy="60"
            r="4"
            fill="#ef4639"
            className="animate-live-breathe"
          />
          <circle cx="340" cy="280" r="3" fill="#ededed" opacity="0.6" />
          <circle cx="60" cy="280" r="3" fill="#ededed" opacity="0.6" />
        </svg>
      </motion.div>
    </div>
  );
}
