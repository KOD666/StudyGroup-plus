"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Timer,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Highlighter,
  Flame,
  ShieldCheck,
  FolderSync,
  Sparkles,
} from "lucide-react";

export function TestimonialSection() {
  const modes = [
    {
      num: "01",
      badge: "POMODORO & CO-WORKING",
      title: "Synchronized Focus Sprints",
      description:
        "Run timed 25-minute focus sprints or 50-minute deep work cycles with gentle audio chimes. Keep each other accountable in quiet library-style presence without camera fatigue.",
      icon: Timer,
      visual: (
        <div className="p-4 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[6px] space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-[4px] bg-[var(--bg-overlay)] text-[var(--text-primary)]">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-lg font-bold tracking-tight text-[var(--text-primary)]">25:00</span>
                <span className="text-[0.625rem] font-mono text-[var(--text-secondary)] uppercase ml-1.5">Focus</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[0.625rem] font-mono uppercase text-[var(--text-primary)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-[4px] border border-[var(--border-hairline)]">
              <Flame className="w-3 h-3 text-[var(--text-primary)]" />
              <span>4 Done</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[0.625rem] font-mono text-center">
            <span className="p-1 bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold rounded-[4px]">
              25m Focus
            </span>
            <span className="p-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-[4px] border border-[var(--border-hairline)]">
              50m Deep
            </span>
            <span className="p-1 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded-[4px] border border-[var(--border-hairline)]">
              5m Break
            </span>
          </div>

          <div className="flex items-center justify-between text-[0.625rem] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-hairline)]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
              <span>Harmonic Chime Active</span>
            </span>
            <span className="font-mono">100% In Sync</span>
          </div>
        </div>
      ),
    },
    {
      num: "02",
      badge: "PDFS & MARKDOWN",
      title: "Annotated Document Reader",
      description:
        "Open lecture slides, textbooks, and research papers edge-to-edge. Highlight passages across four distinct academic categories and build shared margins that stay saved all semester.",
      icon: BookOpen,
      visual: (
        <div className="p-4 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[6px] space-y-3 font-sans">
          {/* Highlight Palette Preview */}
          <div className="flex items-center justify-between text-[0.625rem] font-mono">
            <span className="font-medium uppercase tracking-wider text-[var(--text-secondary)]">Palette</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] font-semibold">
                [CONCEPT]
              </span>
              <span className="px-1.5 py-0.5 bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] font-semibold">
                [EVIDENCE]
              </span>
              <span className="px-1.5 py-0.5 bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] font-semibold">
                [EXAM NOTE]
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-[var(--bg-elevated)] border-l-2 border-[var(--text-primary)] border-y border-r border-[var(--border-hairline)] rounded-r-[4px]">
            <p className="font-serif italic text-xs leading-relaxed text-[var(--text-secondary)]">
              &ldquo;Synaptic plasticity provides the neurobiological substrate for memory consolidation.&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-between text-[0.625rem] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border-hairline)]">
            <span className="flex items-center gap-1">
              <Highlighter className="w-3 h-3 text-[var(--text-primary)]" />
              <span>4 Category Filter</span>
            </span>
            <span className="font-mono">Page 84</span>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      badge: "PROBLEM SETS & EXAMS",
      title: "Question-to-Todo Checkout",
      description:
        "Paste past exam papers, study guides, or syllabus prompts. StudyGroup+ automatically parses each question into an actionable todo where you draft solutions and check them out as a team.",
      icon: HelpCircle,
      visual: (
        <div className="p-4 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[6px] space-y-2.5 font-sans">
          <div className="flex items-center justify-between text-[0.625rem] font-mono">
            <span className="font-medium uppercase tracking-wider text-[var(--text-secondary)]">Problem Set Progress</span>
            <span className="font-semibold text-[var(--text-primary)] bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded-[4px] border border-[var(--border-hairline)]">
              3 of 4 Mastered
            </span>
          </div>

          {/* Mastered Question */}
          <div className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[4px] flex items-center justify-between text-xs opacity-70">
            <span className="font-serif text-xs text-[var(--text-secondary)] line-through truncate max-w-[190px]">
              Derive Euler-Lagrange equations
            </span>
            <span className="text-[var(--text-primary)] font-mono text-[0.625rem] font-medium flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          </div>

          {/* Active Question */}
          <div className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[4px] space-y-1.5">
            <span className="px-1.5 py-0.5 bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[2px] text-[0.625rem] font-mono uppercase font-semibold">
              [QUESTION 4]
            </span>
            <p className="font-serif text-xs font-normal text-[var(--text-primary)]">
              Explain the physical meaning of Hamiltonian action.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border-hairline)] text-[0.625rem] font-mono text-[var(--text-secondary)]">
              <span className="text-[var(--text-primary)] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Check Out Question
              </span>
              <span className="italic">Solution Saved</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="study-modes" className="py-20 sm:py-28 bg-[var(--bg-inset)] border-y border-[var(--border-hairline)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <span className="font-mono text-[0.625rem] font-medium uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded-[4px] border border-[var(--border-hairline)]">
              StudyGroup+ System
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] tracking-tight mb-5"
          >
            Three study modes. One distraction-free desk.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
            className="font-sans text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed"
          >
            Most study groups drown in a maze of video meeting links, buried Google Docs, and noisy chat apps.
            StudyGroup+ unites your reading, problem solving, and focus sprints in a unified academic workspace.
          </motion.p>
        </div>

        {/* 3 Study Modes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {modes.map((mode, index) => (
            <motion.div
              key={mode.num}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: index * 0.08, ease: "easeOut" }}
              className="bg-[var(--bg-elevated)] rounded-[10px] border border-[var(--border-hairline)] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                    Mode {mode.num}
                  </span>
                  <span className="font-mono text-[0.625rem] font-medium uppercase tracking-widest text-[var(--text-primary)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-[4px] border border-[var(--border-hairline)]">
                    {mode.badge}
                  </span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[var(--text-primary)] mb-3">
                  {mode.title}
                </h3>

                <p className="font-sans text-xs sm:text-sm leading-relaxed text-[var(--text-secondary)] mb-6">
                  {mode.description}
                </p>
              </div>

              {/* Mode Visual Demonstration */}
              <div className="mt-2 pt-4 border-t border-[var(--border-hairline)]">
                {mode.visual}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Academic Infrastructure Guarantee Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[10px] p-6 sm:p-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-hairline)]">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5 pt-4 sm:pt-0 sm:pr-4">
              <div className="p-2 rounded-[6px] bg-[var(--bg-overlay)] text-[var(--text-primary)] shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans text-sm font-semibold text-[var(--text-primary)] mb-1">
                  100% Browser-Native
                </h4>
                <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                  WebRTC audio and video with native PDF canvas rendering. No desktop clients or downloads required.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 pt-4 sm:pt-0 sm:px-6">
              <div className="p-2 rounded-[6px] bg-[var(--bg-overlay)] text-[var(--text-primary)] shrink-0 mt-0.5">
                <FolderSync className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Term-Long Persistence
                </h4>
                <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                  Every document, highlight, and checked-out question stays organized in your group repository for finals.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 pt-4 sm:pt-0 sm:pl-6">
              <div className="p-2 rounded-[6px] bg-[var(--bg-overlay)] text-[var(--text-primary)] shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans text-sm font-semibold text-[var(--text-primary)] mb-1">
                  High-Contrast Studio Aesthetic
                </h4>
                <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                  Engineered with high-contrast monochrome surfaces and editorial typography designed to reduce eye strain during late-night study.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
