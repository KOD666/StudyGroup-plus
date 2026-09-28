"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface AnalogStopwatchProps {
  className?: string;
  size?: number;
  onTick?: (elapsedSeconds: number) => void;
}

export function AnalogStopwatch({
  className = "",
  size = 220,
  onTick,
}: AnalogStopwatchProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Timestamp tracking to prevent background tab drift
  const startTimeRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const prefersReducedMotionRef = useRef<boolean>(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotionRef.current = mediaQuery.matches;

    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotionRef.current = e.matches;
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // requestAnimationFrame loop
  const updateLoop = useCallback(() => {
    if (startTimeRef.current !== null) {
      const now = performance.now();
      const currentElapsed =
        accumulatedMsRef.current + (now - startTimeRef.current);
      setElapsedMs(currentElapsed);

      if (onTick) {
        onTick(Math.floor(currentElapsed / 1000));
      }

      animFrameIdRef.current = requestAnimationFrame(updateLoop);
    }
  }, [onTick]);

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(updateLoop);
  };

  const handlePause = () => {
    if (!isRunning) return;
    setIsRunning(false);
    if (startTimeRef.current !== null) {
      accumulatedMsRef.current += performance.now() - startTimeRef.current;
      startTimeRef.current = null;
    }
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    startTimeRef.current = null;
    accumulatedMsRef.current = 0;
    setElapsedMs(0);
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (onTick) {
      onTick(0);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Compute angles
  const totalSeconds = elapsedMs / 1000;
  const isReduced = prefersReducedMotionRef.current;

  // Second hand angle: sweeping (smooth fraction) or stepped (whole seconds for reduced motion)
  const secondHandAngle = isReduced
    ? (Math.floor(totalSeconds) % 60) * 6
    : (totalSeconds % 60) * 6;

  // Minute sub-dial: 30-minute rotation
  const totalMinutes = totalSeconds / 60;
  const minuteHandAngle = (totalMinutes % 30) * 12;

  // Format digital readout
  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = Math.floor(totalSeconds % 60);
  const displayHundredths = Math.floor((elapsedMs % 1000) / 10);

  const formattedDigital = `${String(displayMinutes).padStart(2, "0")}:${String(
    displaySeconds
  ).padStart(2, "0")}.${String(displayHundredths).padStart(2, "0")}`;

  // SVG Dial Tick marks
  const cx = 100;
  const cy = 100;
  const dialRadius = 88;

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const angleRad = (i * 6 - 90) * (Math.PI / 180);
    const isMajor = i % 5 === 0;
    const tickLen = isMajor ? 8 : 4;
    const rOuter = dialRadius;
    const rInner = dialRadius - tickLen;

    const x1 = cx + rInner * Math.cos(angleRad);
    const y1 = cy + rInner * Math.sin(angleRad);
    const x2 = cx + rOuter * Math.cos(angleRad);
    const y2 = cy + rOuter * Math.sin(angleRad);

    ticks.push(
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--border-hairline)"
        strokeWidth={isMajor ? 1.5 : 0.75}
        className={
          isMajor
            ? "stroke-[var(--text-primary)]/80"
            : "stroke-[var(--text-disabled)]"
        }
      />
    );
  }

  // Dial numbers (05, 10, 15, ..., 60)
  const numbers = [];
  for (let i = 5; i <= 60; i += 5) {
    const angleRad = (i * 6 - 90) * (Math.PI / 180);
    const rText = dialRadius - 16;
    const tx = cx + rText * Math.cos(angleRad);
    const ty = cy + rText * Math.sin(angleRad) + 3; // vertical centering offset

    numbers.push(
      <text
        key={i}
        x={tx}
        y={ty}
        textAnchor="middle"
        className="font-mono text-[6.5px] fill-[var(--text-secondary)] select-none"
      >
        {i === 60 ? "60" : String(i).padStart(2, "0")}
      </text>
    );
  }

  // Minute sub-dial ticks (0 to 30 minutes)
  const subCx = 100;
  const subCy = 64;
  const subRadius = 22;
  const subTicks = [];
  for (let m = 0; m < 30; m += 2.5) {
    const angleRad = (m * 12 - 90) * (Math.PI / 180);
    const isSubMajor = m % 5 === 0;
    const tickLen = isSubMajor ? 4 : 2;
    const rOuter = subRadius;
    const rInner = subRadius - tickLen;

    const x1 = subCx + rInner * Math.cos(angleRad);
    const y1 = subCy + rInner * Math.sin(angleRad);
    const x2 = subCx + rOuter * Math.cos(angleRad);
    const y2 = subCy + rOuter * Math.sin(angleRad);

    subTicks.push(
      <line
        key={m}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={
          isSubMajor
            ? "stroke-[var(--text-secondary)]"
            : "stroke-[var(--text-disabled)]"
        }
        strokeWidth={isSubMajor ? 1 : 0.5}
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      style={{ width: size }}
    >
      {/* SVG Analog Dial */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-sm"
          style={{ overflow: "visible" }}
        >
          {/* Outer Bezel Rim */}
          <circle
            cx={cx}
            cy={cy}
            r={95}
            fill="var(--bg-elevated)"
            stroke="var(--border-hairline)"
            strokeWidth="1.5"
          />
          <circle
            cx={cx}
            cy={cy}
            r={dialRadius}
            fill="var(--bg-inset)"
            stroke="var(--border-hairline)"
            strokeWidth="0.75"
          />

          {/* Dial Ticks & Numbers */}
          {ticks}
          {numbers}

          {/* Minute Sub-Dial Track */}
          <circle
            cx={subCx}
            cy={subCy}
            r={subRadius}
            fill="var(--bg-elevated)"
            stroke="var(--border-hairline)"
            strokeWidth="0.75"
          />
          {subTicks}
          {/* Sub-dial labels: 30 and 15 */}
          <text
            x={subCx}
            y={subCy - subRadius + 7}
            textAnchor="middle"
            className="font-mono text-[5px] fill-[var(--text-disabled)]"
          >
            30
          </text>
          <text
            x={subCx}
            y={subCy + subRadius - 3}
            textAnchor="middle"
            className="font-mono text-[5px] fill-[var(--text-disabled)]"
          >
            15
          </text>

          {/* Sub-Dial Hand (Minutes) */}
          <g transform={`rotate(${minuteHandAngle} ${subCx} ${subCy})`}>
            <line
              x1={subCx}
              y1={subCy + 4}
              x2={subCx}
              y2={subCy - subRadius + 4}
              stroke="var(--text-secondary)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx={subCx} cy={subCy} r={2} fill="var(--text-secondary)" />
          </g>

          {/* Sweeping Second Hand (Ochre Accent) */}
          <g transform={`rotate(${secondHandAngle} ${cx} ${cy})`}>
            {/* Counterbalance tail */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy + 18}
              stroke="#d97706"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Long needle pointing to ticks */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - 78}
              stroke="#d97706"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Center Cap */}
            <circle
              cx={cx}
              cy={cy}
              r={3.5}
              fill="#d97706"
              stroke="var(--bg-elevated)"
              strokeWidth="1"
            />
            <circle cx={cx} cy={cy} r={1} fill="var(--bg-elevated)" />
          </g>
        </svg>
      </div>

      {/* Digital Readout Beneath */}
      <div className="mt-3 text-center">
        <div className="font-mono text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {formattedDigital}
        </div>
        <div className="font-mono text-[0.625rem] text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">
          {isRunning ? "Running" : elapsedMs > 0 ? "Paused" : "Stopped"}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={isRunning ? handlePause : handleStart}
          className={`px-3 py-1.5 rounded-[var(--radius-button)] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            isRunning
              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] hover:opacity-90"
              : "bg-[#d97706] text-white hover:bg-[#b45309]"
          }`}
          title={isRunning ? "Pause Stopwatch" : "Start Stopwatch"}
        >
          {isRunning ? (
            <>
              <Pause className="w-3 h-3" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={elapsedMs === 0}
          className="p-1.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Reset Stopwatch"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
