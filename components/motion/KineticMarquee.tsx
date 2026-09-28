"use client";

import React from "react";

interface KineticMarqueeProps {
  items?: string[];
  speed?: number; // duration in seconds
  tilt?: boolean; // slight angle like ainsley.dev .home-marquee
  className?: string;
}

/**
 * Infinite Kinetic Marquee directly inspired by ainsley.dev's `.home-marquee`:
 * - Tilted/angled high-contrast banner with bold typography
 * - Smooth seamless loop with infinite linear translation
 * - Pauses gently on hover
 * - Vivid red (#ef4639) glowing separator accents
 */
export function KineticMarquee({
  items = [
    "DEEP FOCUS ROOMS",
    "AI NOTE SYNTHESIS",
    "LATEX SYNC VAULT",
    "LIVEKIT AUDIO MESH",
    "REALTIME TRANSCRIPTS",
    "QUESTION CHECKOUTS",
    "ZERO LATENCY COLLAB",
    "PERSISTENT ARCHIVES",
  ],
  speed = 32,
  tilt = true,
  className = "",
}: KineticMarqueeProps) {
  const tripleItems = [...items, ...items, ...items];

  return (
    <div
      className={`relative w-full overflow-hidden select-none py-6 border-y border-[var(--border-hairline)] bg-[var(--bg-inset)] ${
        tilt
          ? "-rotate-1 md:-rotate-1.5 my-8 sm:my-12 scale-[1.02] shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          : ""
      } ${className}`}
    >
      {/* Edge gradient masks for smooth entry/exit */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10" />

      <div
        className="flex w-max items-center animate-kinetic-marquee hover:[animation-play-state:paused]"
        style={{ animationDuration: `${speed}s` }}
      >
        {tripleItems.map((text, i) => (
          <div key={i} className="flex items-center shrink-0 mx-6 sm:mx-8">
            <span className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--text-primary)] font-normal tracking-tight">
              {text}
            </span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ef4639] ml-6 sm:ml-8 shadow-[0_0_10px_rgba(239,70,57,0.7)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
