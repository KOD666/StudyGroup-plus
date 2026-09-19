"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Headline & Plain Intro */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="lg:col-span-6 flex flex-col justify-center pt-2"
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[#78746d] bg-[#f4f2eb] px-2.5 py-1 rounded-[0.125rem] border border-[#e5e2d9]">
                Collaborative Workspace <span className="text-[#ba5d1a]">/</span> Study Rooms
              </span>
            </div>

            {/* Display Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[4.25rem] leading-[1.08] tracking-[-0.03em] text-[#171615] font-normal mb-8">
              A quiet room for serious study. Where the call lives inside your work.
            </h1>

            {/* Plain Language Subheading */}
            <p className="font-sans text-lg sm:text-xl leading-relaxed text-[#5e5a54] mb-10 max-w-xl font-normal">
              Video calls usually distract from actual studying.{" "}
              <strong className="font-medium text-[#171615]">StudyGroup+</strong> embeds live audio and video
              directly inside shared reading documents, focus timers, question checkouts, and persistent archives.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-16">
              <Link href="/sign-up">
                <Button variant="primary" size="lg" className="px-8 shadow-xs hover:shadow-sm">
                  Create a Study Group
                </Button>
              </Link>
              <a
                href="#features"
                className="font-editorial italic text-base text-[#171615] hover:text-[#ba5d1a] transition-colors inline-flex items-center gap-1.5 group"
              >
                <span>Learn How It Works</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 text-[#ba5d1a]" />
              </a>
            </div>

            {/* Social Proof */}
            <div className="border-t border-[#e5e2d9] pt-6">
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.12em] font-semibold text-[#78746d] mb-2.5">
                Adopted by Reading &amp; Study Groups At:
              </p>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-editorial italic text-[#5e5a54]">
                <span>University of Oxford</span>
                <span className="text-[#ddd8cc]">•</span>
                <span>King&apos;s College London</span>
                <span className="text-[#ddd8cc]">•</span>
                <span>Columbia University</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Live Interactive Study Studio Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-6 lg:pl-4"
          >
            <div className="bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] shadow-paper-floating overflow-hidden font-sans">
              {/* Window Chrome Header */}
              <div className="px-4 sm:px-5 py-3 bg-[#faf9f6] border-b border-[#e5e2d9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e6e2df]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e6e2df]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e6e2df]" />
                  </div>
                  <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#5e5a54] truncate max-w-[160px] sm:max-w-none">
                    NEURO 301: Synaptic Mechanisms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-[0.25rem] bg-[#234338]/10 text-[#234338] text-[0.625rem] font-semibold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#234338] animate-pulse" />
                    <span>3 Studying</span>
                  </div>
                </div>
              </div>

              {/* Interactive Top Tool Strip: Active Timer & Highlight Selector */}
              <div className="px-4 sm:px-5 py-2.5 bg-[#fbf9f4] border-b border-[#e5e2d9] flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Active Focus Timer Pill (Interactive) */}
                <div className="flex items-center gap-1.5 bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] px-2 py-1 text-[0.6875rem] text-[#171615] shadow-2xs">
                  <Timer className={`w-3 h-3 ${isTimerRunning ? "text-[#ba5d1a] animate-pulse" : "text-[#78746d]"}`} />
                  <span className="font-mono font-bold tracking-tight text-[#171615]">{timerFormatted}</span>
                  <span className="text-[0.625rem] text-[#78746d] font-medium uppercase tracking-wider">Focus</span>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="p-0.5 text-[#ba5d1a] hover:text-[#a24e14] transition-colors"
                    title={isTimerRunning ? "Pause timer" : "Start timer"}
                  >
                    {isTimerRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimerSeconds(25 * 60)}
                    className="p-0.5 text-[#78746d] hover:text-[#171615] transition-colors"
                    title="Reset to 25m"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Highlight Category Filters */}
                <div className="flex items-center gap-1.5 text-[0.625rem]">
                  <Highlighter className="w-3 h-3 text-[#ba5d1a] hidden sm:inline" />
                  <button
                    type="button"
                    onClick={() => setActiveHighlight(activeHighlight === "concept" ? "all" : "concept")}
                    className={`px-2 py-0.5 rounded-[0.125rem] border flex items-center gap-1 transition-colors ${
                      activeHighlight === "concept" || activeHighlight === "all"
                        ? "bg-amber-100 border-amber-300 text-amber-950 font-semibold"
                        : "bg-white border-[#ddd8cc] text-[#78746d]"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Concept</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHighlight(activeHighlight === "evidence" ? "all" : "evidence")}
                    className={`px-2 py-0.5 rounded-[0.125rem] border flex items-center gap-1 transition-colors ${
                      activeHighlight === "evidence" || activeHighlight === "all"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-950 font-semibold"
                        : "bg-white border-[#ddd8cc] text-[#78746d]"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Evidence</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHighlight(activeHighlight === "exam" ? "all" : "exam")}
                    className={`px-2 py-0.5 rounded-[0.125rem] border flex items-center gap-1 transition-colors ${
                      activeHighlight === "exam" || activeHighlight === "all"
                        ? "bg-rose-100 border-rose-300 text-rose-950 font-semibold"
                        : "bg-white border-[#ddd8cc] text-[#78746d]"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>Exam Note</span>
                  </button>
                </div>
              </div>

              {/* Workspace Content Canvas */}
              <div className="p-5 sm:p-6 bg-[#ffffff] space-y-5">
                {/* Document Excerpt with Authentic Highlight Annotations */}
                <div>
                  <div className="flex items-baseline justify-between border-b border-[#e5e2d9]/70 pb-2.5 mb-4">
                    <h3 className="font-serif text-lg sm:text-xl font-normal text-[#171615]">
                      Ch. 4: Long-Term Potentiation &amp; Memory
                    </h3>
                    <span className="font-mono text-xs text-[#78746d]">
                      Pg 114
                    </span>
                  </div>

                  <p className="font-editorial text-sm sm:text-base leading-[1.8] text-[#171615] mb-4">
                    &ldquo;Long-term potentiation represents an enduring enhancement in signal transmission.
                    Under high-frequency stimulation, post-synaptic depolarization{" "}
                    <mark className="bg-amber-100/90 text-amber-950 px-1.5 py-0.5 rounded-[0.125rem] border-b-2 border-amber-400 font-medium">
                      expels the magnesium (Mg²⁺) ion block
                    </mark>{" "}
                    from NMDA receptors, allowing the influx of{" "}
                    <mark className="bg-emerald-100/90 text-emerald-950 px-1.5 py-0.5 rounded-[0.125rem] border-b-2 border-emerald-400 font-medium">
                      calcium ions (Ca²⁺)
                    </mark>{" "}
                    vital for structural synaptic remodeling.&rdquo;
                  </p>

                  {/* Shared Margin Note Callout */}
                  <div className="p-3 bg-[#fffaf5] border-l-2 border-[#ba5d1a] border-y border-r border-[#ffdbc9]/60 rounded-r-[0.25rem]">
                    <div className="flex items-center justify-between text-[0.625rem] mb-1">
                      <span className="font-semibold uppercase tracking-wider text-[#ba5d1a]">
                        Shared Margin Note • Elena V. (2m ago)
                      </span>
                      <span className="text-[#78746d]">Page 114</span>
                    </div>
                    <p className="font-editorial italic text-xs leading-relaxed text-[#554339]">
                      &ldquo;Crucial for Thursday&apos;s midterm: remember CaMKII autophosphorylation sustains the potentiation even after Ca²⁺ returns to basal levels.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Study Tools: Question-to-Todo Checkout (Interactive) */}
                <div className="p-3.5 bg-[#fbf9f4] border border-[#e5e2d9] rounded-[0.25rem] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#ba5d1a]" />
                      <span className="font-semibold uppercase tracking-wider text-[#171615] text-[0.6875rem]">
                        Study Tools • Problem Set 4
                      </span>
                    </div>
                    <span className="text-[0.625rem] font-semibold text-[#234338] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {isQuestionCheckedOut ? "2 of 2 Mastered" : "1 of 2 Mastered"}
                    </span>
                  </div>

                  {/* Question Item 1: Already Checked Out */}
                  <div className="p-2.5 bg-white border border-[#e5e2d9] rounded-[0.25rem] space-y-1 opacity-75">
                    <div className="flex items-center justify-between text-[0.625rem]">
                      <span className="font-semibold text-[#78746d] uppercase">Question 1</span>
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Checked out at 14:12
                      </span>
                    </div>
                    <p className="font-serif text-xs text-[#78746d] line-through">
                      What molecular mechanism relieves the Mg²⁺ blockade of NMDA channels?
                    </p>
                  </div>

                  {/* Question Item 2: Active & Clickable Checkout */}
                  <div className="p-3 bg-white border border-[#e8d5c4] rounded-[0.25rem] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-[0.625rem]">
                      <span className="px-1.5 py-0.5 rounded-[0.125rem] bg-amber-100 text-amber-900 border border-amber-300 font-semibold uppercase tracking-wider">
                        Question 2
                      </span>
                      <span className="text-[#78746d]">Assigned to You</span>
                    </div>

                    <p className="font-serif text-xs font-medium text-[#171615] leading-snug">
                      Explain why APV selectively blocks LTP induction without suppressing baseline synaptic transmission.
                    </p>

                    {/* Interactive Checkout Trigger */}
                    {isQuestionCheckedOut ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-between text-xs text-emerald-900">
                        <div className="flex items-center gap-1.5 font-semibold text-[0.6875rem]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Checked out just now</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsQuestionCheckedOut(false)}
                          className="text-[0.625rem] text-emerald-700 underline font-medium hover:text-emerald-950"
                        >
                          Undo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsQuestionCheckedOut(true)}
                        className="w-full py-1.5 px-3 bg-[#ffffff] hover:bg-[#234338]/10 border border-[#234338]/40 hover:border-[#234338] text-[#234338] rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#234338]" />
                        <span>Check Out Question (Click to test)</span>
                      </button>
                    )}

                    <p className="text-[0.625rem] text-[#5e5a54] italic pt-1 border-t border-[#e5e2d9]/60">
                      Solution Note: &ldquo;APV blocks NMDA receptors, sparing AMPA baseline transmission.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer: Real-time Presence Strip */}
              <div className="px-4 sm:px-5 py-3 bg-[#faf9f6] border-t border-[#e5e2d9] flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Active Group Presence */}
                <div className="flex items-center gap-3">
                  {/* Elena (Speaking) */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#ba5d1a] text-white flex items-center justify-center text-[0.625rem] font-semibold">
                      EV
                    </div>
                    <div className="flex items-center gap-1 text-[0.6875rem] text-[#171615] font-medium">
                      <span>Elena</span>
                      {/* Animated mini soundwave */}
                      <span className="flex items-center gap-0.5 ml-0.5">
                        <span className="w-0.5 h-2 bg-[#234338] rounded-full animate-bounce" />
                        <span className="w-0.5 h-3.5 bg-[#234338] rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-0.5 h-2 bg-[#234338] rounded-full animate-bounce [animation-delay:300ms]" />
                      </span>
                    </div>
                  </div>

                  {/* David (Muted) */}
                  <div className="flex items-center gap-1.5 text-[0.6875rem] text-[#78746d]">
                    <div className="w-5 h-5 rounded-full bg-[#ddd8cc] text-[#5e5a54] flex items-center justify-center text-[0.625rem] font-semibold">
                      DK
                    </div>
                    <span className="hidden sm:inline">David</span>
                  </div>

                  {/* You */}
                  <div className="flex items-center gap-1.5 text-[0.6875rem] text-[#234338] font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#234338] text-white flex items-center justify-center text-[0.625rem] font-semibold">
                      You
                    </div>
                    <span className="hidden sm:inline">Focused</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-[#234338]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-wider">Live Library Room</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
