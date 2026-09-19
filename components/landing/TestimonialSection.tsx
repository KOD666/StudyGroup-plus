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
      color: "ochre",
      visual: (
        <div className="p-4 bg-[#ffffff] border border-[#e5e2d9] rounded-[0.25rem] space-y-3 font-sans shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#ba5d1a]/10 text-[#ba5d1a]">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono text-lg font-bold tracking-tight text-[#171615]">25:00</span>
                <span className="text-[0.625rem] font-semibold text-[#78746d] uppercase ml-1.5">Focus</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-[#ba5d1a] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <Flame className="w-3 h-3 text-[#ba5d1a]" />
              <span>4 Done</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[0.625rem] font-medium text-center">
            <span className="p-1 bg-[#ba5d1a]/10 text-[#ba5d1a] font-semibold rounded border border-[#ba5d1a]/30">
              🍅 25m Focus
            </span>
            <span className="p-1 bg-white text-[#5e5a54] rounded border border-[#ddd8cc]">
              📚 50m Deep
            </span>
            <span className="p-1 bg-white text-[#5e5a54] rounded border border-[#ddd8cc]">
              ☕ 5m Break
            </span>
          </div>

          <div className="flex items-center justify-between text-[0.625rem] text-[#78746d] pt-1 border-t border-[#e5e2d9]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#234338]" />
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
      color: "forest",
      visual: (
        <div className="p-4 bg-[#ffffff] border border-[#e5e2d9] rounded-[0.25rem] space-y-3 font-sans shadow-2xs">
          {/* Highlight Palette Preview */}
          <div className="flex items-center justify-between text-[0.625rem]">
            <span className="font-semibold uppercase tracking-wider text-[#78746d]">Highlighter Palette</span>
            <div className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-[0.125rem] font-semibold">
                Concept
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[0.125rem] font-semibold">
                Evidence
              </span>
              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded-[0.125rem] font-semibold">
                Exam
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-amber-50/70 border-l-2 border-amber-400 border-y border-r border-amber-200/60 rounded-r-[0.125rem]">
            <p className="font-editorial italic text-xs leading-relaxed text-[#171615]">
              &ldquo;Synaptic plasticity provides the neurobiological substrate for memory consolidation.&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-between text-[0.625rem] text-[#78746d] pt-1 border-t border-[#e5e2d9]">
            <span className="flex items-center gap-1">
              <Highlighter className="w-3 h-3 text-[#ba5d1a]" />
              <span>4 Category Color Filter</span>
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
      color: "neutral",
      visual: (
        <div className="p-4 bg-[#ffffff] border border-[#e5e2d9] rounded-[0.25rem] space-y-2.5 font-sans shadow-2xs">
          <div className="flex items-center justify-between text-[0.625rem]">
            <span className="font-semibold uppercase tracking-wider text-[#78746d]">Problem Set Progress</span>
            <span className="font-semibold text-[#234338] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              3 of 4 Mastered
            </span>
          </div>

          {/* Mastered Question */}
          <div className="p-2 bg-[#faf9f6] border border-[#e5e2d9] rounded flex items-center justify-between text-xs opacity-75">
            <span className="font-serif text-xs text-[#78746d] line-through truncate max-w-[190px]">
              Derive Euler-Lagrange equations
            </span>
            <span className="text-emerald-700 text-[0.625rem] font-semibold flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
            </span>
          </div>

          {/* Active Question */}
          <div className="p-2.5 bg-white border border-[#e8d5c4] rounded space-y-1.5 shadow-2xs">
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded-[0.125rem] text-[0.625rem] font-semibold uppercase">
              Question 4
            </span>
            <p className="font-serif text-xs font-medium text-[#171615]">
              Explain the physical meaning of Hamiltonian action.
            </p>
            <div className="flex items-center justify-between pt-1 border-t border-[#e5e2d9]/60 text-[0.625rem]">
              <span className="text-[#ba5d1a] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Check Out Question
              </span>
              <span className="text-[#78746d] italic">Solution Saved</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="study-modes" className="py-20 sm:py-28 bg-[#f4f2eb] border-y border-[#e5e2d9] relative">
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
            <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#ba5d1a] bg-[#fff2eb] px-2.5 py-1 rounded-[0.125rem] border border-[#ffdbc9]">
              StudyGroup+ System
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#171615] tracking-tight mb-5"
          >
            Three study modes. One distraction-free desk.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: 0.05, ease: "easeOut" }}
            className="font-sans text-base sm:text-lg text-[#5e5a54] leading-relaxed"
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
              className="bg-[#faf9f6] rounded-[0.25rem] border border-[#e5e2d9] p-6 flex flex-col justify-between shadow-paper-contact hover:shadow-paper-floating transition-shadow duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-editorial italic text-sm text-[#78746d]">
                    Mode {mode.num}
                  </span>
                  <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-wider text-[#ba5d1a] bg-[#fff2eb] px-2 py-0.5 rounded border border-[#ffdbc9]">
                    {mode.badge}
                  </span>
                </div>

                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#171615] mb-3">
                  {mode.title}
                </h3>

                <p className="font-sans text-xs sm:text-sm leading-relaxed text-[#5e5a54] mb-6">
                  {mode.description}
                </p>
              </div>

              {/* Mode Visual Demonstration */}
              <div className="mt-2 pt-4 border-t border-[#e5e2d9]/60">
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
          className="bg-[#faf9f6] border border-[#ddd8cc] rounded-[0.25rem] p-6 sm:p-8 shadow-2xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#e5e2d9]">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5 pt-4 sm:pt-0 sm:pr-4">
              <div className="p-2 rounded bg-[#234338]/10 text-[#234338] shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans text-sm font-semibold text-[#171615] mb-1">
                  100% Browser-Native
                </h4>
                <p className="font-sans text-xs text-[#5e5a54] leading-relaxed">
                  WebRTC audio and video with native PDF canvas rendering. No desktop clients or downloads required.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 pt-4 sm:pt-0 sm:px-6">
              <div className="p-2 rounded bg-[#ba5d1a]/10 text-[#ba5d1a] shrink-0 mt-0.5">
                <FolderSync className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans text-sm font-semibold text-[#171615] mb-1">
                  Term-Long Persistence
                </h4>
                <p className="font-sans text-xs text-[#5e5a54] leading-relaxed">
                  Every document, highlight, and checked-out question stays organized in your group repository for finals.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 pt-4 sm:pt-0 sm:pl-6">
              <div className="p-2 rounded bg-[#171615]/10 text-[#171615] shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-sans text-sm font-semibold text-[#171615] mb-1">
                  Parchment Focus Aesthetic
                </h4>
                <p className="font-sans text-xs text-[#5e5a54] leading-relaxed">
                  Engineered with warm parchment tones and editorial typography designed to reduce eye strain during late-night study.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
