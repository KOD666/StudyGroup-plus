"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function DigitColumn({ digit }: { digit: string }) {
  const shouldReduceMotion = useReducedMotion();
  const num = parseInt(digit, 10);

  if (isNaN(num)) {
    return <span className="inline-block">{digit}</span>;
  }

  if (shouldReduceMotion) {
    return (
      <span className="inline-block w-[1ch] text-center font-mono">
        {digit}
      </span>
    );
  }

  return (
    <span className="relative inline-block h-[1.2em] w-[1ch] overflow-hidden align-middle font-mono">
      <motion.span
        className="absolute left-0 flex flex-col items-center"
        initial={false}
        animate={{ y: `-${num * 10}%` }}
        transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="h-[1.2em] flex items-center justify-center leading-none"
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/**
 * Greeting clock conforming to DESIGN.md §6.1:
 * - Live local time in mono type
 * - Vertical digit-roll (odometer-style, --dur-fast) only on changing digits
 * - Reduced motion fallback: hard replace without roll
 */
export function GreetingClock() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours() % 12 || 12).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      setTimeStr(`${hours}:${minutes}:${seconds} ${ampm}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeStr) {
    return (
      <span className="font-mono text-xs text-[var(--text-secondary)]">
        00:00:00 AM
      </span>
    );
  }

  return (
    <span className="font-mono text-xs tracking-[0.02em] text-[var(--text-secondary)] flex items-center gap-0.5">
      {timeStr.split("").map((char, index) => (
        <DigitColumn key={index} digit={char} />
      ))}
    </span>
  );
}
