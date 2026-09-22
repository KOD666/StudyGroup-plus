"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Highlighter,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { KineticReveal } from "@/components/motion/KineticReveal";
import { MagneticSkew } from "@/components/motion/MagneticSkew";
import { ArrowHover } from "@/components/motion/ArrowHover";
import { CardSpotlight } from "@/components/motion/CardSpotlight";
import { HeroSculpture } from "@/components/motion/HeroSculpture";

export function HeroSection() {
  // Interactive preview states
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(24 * 60 + 18);
  const [isQuestionCheckedOut, setIsQuestionCheckedOut] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<"all" | "concept" | "evidence" | "exam">("all");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 1 ? prev - 1 : 25 * 60));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timerFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
      {/* 3D Geometric Sculpture in Hero Background (ainsley.dev .home-three-d signature) */}
      <div className="pointer-events-none absolute -top-10 -right-16 md:right-4 lg:right-20 lg:top-4 w-72 sm:w-96 lg:w-[480px] opacity-35 lg:opacity-55 -z-10">
        <HeroSculpture />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Headline & Plain Intro */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col justify-center pt-2"
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="font-mono text-[0.625rem] font-medium uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded-[4px] border border-[var(--border-hairline)]">
                Collaborative Workspace <span className="opacity-40">/</span> Study Rooms
              </span>
            </div>

            {/* Display Headline with word-by-word kinetic mask reveal */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[4.25rem] leading-[1.08] tracking-[-0.02em] text-[var(--text-primary)] font-normal mb-8">
              <KineticReveal
                text="A quiet room for serious study. Where the call lives inside your work."
                delay={0.05}
              />
            </h1>

            {/* Plain Language Subheading */}
            <p className="font-sans text-lg sm:text-xl leading-relaxed text-[var(--text-secondary)] mb-10 max-w-xl font-normal">
              Video calls usually distract from actual studying.{" "}
              <strong className="font-medium text-[var(--text-primary)]">StudyGroup+</strong> embeds live audio and video
              directly inside shared reading documents, focus timers, question checkouts, and persistent archives.
            </p>

            {/* Actions with Magnetic Skew and ArrowHover */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-16">
              <MagneticSkew transformFactor={0.16} rotateFactor={0.1}>
                <Link href="/sign-up">
                  <Button variant="primary" size="lg" className="px-8 magnetic-cta">
                    Create a Study Group
                  </Button>
                </Link>
              </MagneticSkew>
              <a
                href="#features"
                className="font-serif italic text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2 group cursor-element"
              >
                <span>Learn How It Works</span>
                <ArrowHover size={18} />
              </a>
            </div>

            {/* Social Proof */}
            <div className="border-t border-[var(--border-hairline)] pt-6">
              <p className="font-mono text-[0.625rem] uppercase tracking-widest font-medium text-[var(--text-secondary)] mb-2.5">
                Adopted by Reading &amp; Study Groups At:
              </p>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-serif italic text-[var(--text-secondary)]">
                <span>University of Oxford</span>
                <span className="opacity-30">•</span>
                <span>King&apos;s College London</span>
                <span className="opacity-30">•</span>
                <span>Columbia University</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Live Interactive Study Studio Preview with CardSpotlight & MagneticSkew */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 lg:pl-4"
          >
            <MagneticSkew transformFactor={0.04} rotateFactor={0.03} shouldRotate={true} className="w-full">
              <CardSpotlight glowColor="rgba(239, 70, 57, 0.08)" borderColor="rgba(239, 70, 57, 0.3)" className="rounded-[10px]">
                <div className="bg-[var(--bg-elevated)] rounded-[10px] border border-[var(--border-hairline)] overflow-hidden font-sans">
              {/* Window Chrome Header */}
              <div className="px-4 sm:px-5 py-3 bg-[var(--bg-inset)] border-b border-[var(--border-hairline)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-hairline)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-hairline)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-hairline)]" />
                  </div>
                  <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--text-secondary)] truncate max-w-[160px] sm:max-w-none">
                    NEURO 301: Synaptic Mechanisms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[var(--bg-overlay)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[0.625rem] font-mono uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
                    <span>3 Studying</span>
                  </div>
                </div>
              </div>

              {/* Interactive Top Tool Strip: Active Timer & Highlight Selector */}
              <div className="px-4 sm:px-5 py-2.5 bg-[var(--bg-inset)] border-b border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Active Focus Timer Pill (Interactive) */}
                <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[6px] px-2.5 py-1 text-[0.6875rem] text-[var(--text-primary)]">
                  <Timer className={`w-3.5 h-3.5 ${isTimerRunning ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`} />
                  <span className="font-mono font-bold tracking-tight text-[var(--text-primary)]">{timerFormatted}</span>
                  <span className="text-[0.625rem] text-[var(--text-secondary)] font-mono uppercase tracking-wider">Focus</span>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title={isTimerRunning ? "Pause timer" : "Start timer"}
                  >
                    {isTimerRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimerSeconds(25 * 60)}
                    className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Reset to 25m"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Highlight Category Filters */}
                <div className="flex items-center gap-1.5 text-[0.625rem] font-mono">
                  <Highlighter className="w-3 h-3 text-[var(--text-secondary)] hidden sm:inline" />
                  <button
                    type="button"
                    onClick={() => setActiveHighlight(activeHighlight === "concept" ? "all" : "concept")}
                    className={`px-2 py-0.5 rounded-[4px] border uppercase transition-colors ${
                      activeHighlight === "concept" || activeHighlight === "all"
                        ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)] font-semibold"
                        : "bg-[var(--bg-elevated)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    [CONCEPT]
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHighlight(activeHighlight === "evidence" ? "all" : "evidence")}
                    className={`px-2 py-0.5 rounded-[4px] border uppercase transition-colors ${
                      activeHighlight === "evidence" || activeHighlight === "all"
                        ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)] font-semibold"
                        : "bg-[var(--bg-elevated)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    [EVIDENCE]
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHighlight(activeHighlight === "exam" ? "all" : "exam")}
                    className={`px-2 py-0.5 rounded-[4px] border uppercase transition-colors ${
                      activeHighlight === "exam" || activeHighlight === "all"
                        ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)] font-semibold"
                        : "bg-[var(--bg-elevated)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    [EXAM NOTE]
                  </button>
                </div>
              </div>

              {/* Workspace Content Canvas */}
              <div className="p-5 sm:p-6 bg-[var(--bg-elevated)] space-y-5">
                {/* Document Excerpt with Authentic Highlight Annotations */}
                <div>
                  <div className="flex items-baseline justify-between border-b border-[var(--border-hairline)] pb-2.5 mb-4">
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-[var(--text-primary)]">
                      Ch. 4: Long-Term Potentiation &amp; Memory
                    </h3>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      Pg 114
                    </span>
                  </div>

                  <p className="font-sans text-sm sm:text-base leading-[1.8] text-[var(--text-secondary)] mb-4">
                    &ldquo;Long-term potentiation represents an enduring enhancement in signal transmission.
                    Under high-frequency stimulation, post-synaptic depolarization{" "}
                    <mark className="bg-[var(--bg-overlay)] text-[var(--text-primary)] px-1.5 py-0.5 rounded-[2px] border-b border-[var(--text-primary)] font-mono text-xs">
                      expels the magnesium (Mg²⁺) ion block
                    </mark>{" "}
                    from NMDA receptors, allowing the influx of{" "}
                    <mark className="bg-[var(--bg-overlay)] text-[var(--text-primary)] px-1.5 py-0.5 rounded-[2px] border-b border-[var(--text-primary)] font-mono text-xs">
                      calcium ions (Ca²⁺)
                    </mark>{" "}
                    vital for structural synaptic remodeling.&rdquo;
                  </p>

                  {/* Shared Margin Note Callout */}
                  <div className="p-3 bg-[var(--bg-inset)] border-l-2 border-[var(--text-primary)] border-y border-r border-[var(--border-hairline)] rounded-r-[6px]">
                    <div className="flex items-center justify-between text-[0.625rem] font-mono mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                        Shared Margin Note • Elena V. (2m ago)
                      </span>
                      <span className="text-[var(--text-secondary)]">Page 114</span>
                    </div>
                    <p className="font-serif italic text-xs leading-relaxed text-[var(--text-secondary)]">
                      &ldquo;Crucial for Thursday&apos;s midterm: remember CaMKII autophosphorylation sustains the potentiation even after Ca²⁺ returns to basal levels.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Study Tools: Question-to-Todo Checkout (Interactive) */}
                <div className="p-3.5 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[6px] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                      <span className="font-mono uppercase tracking-wider text-[var(--text-primary)] text-[0.6875rem]">
                        Study Tools • Problem Set 4
                      </span>
                    </div>
                    <span className="text-[0.625rem] font-mono uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border-hairline)]">
                      {isQuestionCheckedOut ? "2 of 2 Mastered" : "1 of 2 Mastered"}
                    </span>
                  </div>

                  {/* Question Item 1: Already Checked Out */}
                  <div className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[6px] space-y-1 opacity-70">
                    <div className="flex items-center justify-between text-[0.625rem] font-mono">
                      <span className="font-medium text-[var(--text-secondary)] uppercase">[QUESTION 1]</span>
                      <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[var(--text-primary)]" /> Checked out at 14:12
                      </span>
                    </div>
                    <p className="font-serif text-xs text-[var(--text-secondary)] line-through">
                      What molecular mechanism relieves the Mg²⁺ blockade of NMDA channels?
                    </p>
                  </div>

                  {/* Question Item 2: Active & Clickable Checkout */}
                  <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[6px] space-y-2">
                    <div className="flex items-center justify-between text-[0.625rem] font-mono">
                      <span className="px-1.5 py-0.5 rounded-[2px] bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-hairline)] font-semibold uppercase tracking-wider">
                        [QUESTION 2]
                      </span>
                      <span className="text-[var(--text-secondary)]">Assigned to You</span>
                    </div>

                    <p className="font-serif text-xs font-normal text-[var(--text-primary)] leading-snug">
                      Explain why APV selectively blocks LTP induction without suppressing baseline synaptic transmission.
                    </p>

                    {/* Interactive Checkout Trigger */}
                    {isQuestionCheckedOut ? (
                      <div className="p-2 bg-[var(--bg-overlay)] border border-[var(--border-hairline)] rounded flex items-center justify-between text-xs text-[var(--text-primary)]">
                        <div className="flex items-center gap-1.5 font-mono text-[0.6875rem]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                          <span>Checked out just now</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQuestionCheckedOut(false)}
                          className="text-[0.625rem] font-mono text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]"
                        >
                          Undo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsQuestionCheckedOut(true)}
                        className="w-full py-1.5 px-3 bg-[var(--bg-primary)] hover:bg-[var(--bg-overlay)] border border-[var(--border-hairline)] text-[var(--text-primary)] rounded text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Check Out Question (Click to test)</span>
                      </button>
                    )}

                    <p className="text-[0.625rem] text-[var(--text-secondary)] italic pt-1 border-t border-[var(--border-hairline)]">
                      Solution Note: &ldquo;APV blocks NMDA receptors, sparing AMPA baseline transmission.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer: Real-time Presence Strip */}
              <div className="px-4 sm:px-5 py-3 bg-[var(--bg-inset)] border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                {/* Active Group Presence */}
                <div className="flex items-center gap-3">
                  {/* Elena (Speaking) */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center text-[0.625rem] font-semibold">
                      EV
                    </div>
                    <div className="flex items-center gap-1 text-[0.6875rem] text-[var(--text-primary)] font-medium">
                      <span>Elena</span>
                      {/* Animated mini soundwave */}
                      <span className="flex items-center gap-0.5 ml-0.5">
                        <span className="w-0.5 h-2 bg-[var(--text-primary)] rounded-full animate-bounce" />
                        <span className="w-0.5 h-3.5 bg-[var(--text-primary)] rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-0.5 h-2 bg-[var(--text-primary)] rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>

                  {/* David (Muted) */}
                  <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-secondary)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-hairline)] text-[var(--text-secondary)] flex items-center justify-center text-[0.625rem] font-semibold">
                      DK
                    </div>
                    <span className="hidden sm:inline">David</span>
                  </div>

                  {/* You */}
                  <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-primary)] font-medium">
                    <div className="w-5 h-5 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-hairline)] text-[var(--text-primary)] flex items-center justify-center text-[0.625rem] font-semibold">
                      You
                    </div>
                    <span className="hidden sm:inline">Focused</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-[var(--text-secondary)]">
                  <Volume2 className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                  <span className="uppercase tracking-wider">Live Library Room</span>
                </div>
              </div>
            </div>
          </CardSpotlight>
        </MagneticSkew>
      </motion.div>
        </div>
      </div>
    </section>
  );
}
