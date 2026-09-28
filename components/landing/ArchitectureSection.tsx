"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Video } from "lucide-react";
import { KineticReveal } from "@/components/motion/KineticReveal";
import { MagneticSkew } from "@/components/motion/MagneticSkew";
import { CardSpotlight } from "@/components/motion/CardSpotlight";

export function ArchitectureSection() {
  const pillars = [
    {
      num: "01",
      category: "Document Persistence",
      title: "Saved Notes & Documents",
      description:
        "When your video call ends, your work remains. Shared documents, margin notes, and highlighted text stay saved in your group library across the entire term.",
      statusLabel: "LIBRARY STATUS",
      statusValue: "Persistent across all sessions",
      icon: BookOpen,
    },
    {
      num: "02",
      category: "Built-In Presence",
      title: "In-line Video & Voice",
      description:
        "Move seamlessly between quiet solo reading and spontaneous group discussion without generating meeting links or opening separate video apps.",
      statusLabel: "ROOM AUDIO",
      statusValue: "Low-latency LiveKit audio & video",
      icon: Video,
    },
  ];

  return (
    <section
      id="features"
      className="py-20 md:py-28 border-t border-[var(--border-hairline)] bg-[var(--bg-primary)] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--text-secondary)] block mb-3">
            Core Features
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] tracking-tight mb-4">
            <KineticReveal text="How StudyGroup+ Works" delay={0.1} />
          </h2>
          <p className="font-sans text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            Designed for deep focus, shared documents, and effortless group
            collaboration without the friction of disconnected tools.
          </p>
        </div>

        {/* 2 Columns Grid with MagneticSkew & CardSpotlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {pillars.map((item, index) => (
            <motion.div
              key={item.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <MagneticSkew
                transformFactor={0.06}
                rotateFactor={0.04}
                shouldRotate={true}
                className="h-full"
              >
                <CardSpotlight
                  glowColor="rgba(239, 70, 57, 0.08)"
                  borderColor="rgba(239, 70, 57, 0.3)"
                  className="h-full rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 sm:p-8 flex flex-col justify-between transition-colors duration-300 hover:border-[var(--border-hover)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                        {item.num} / {item.category}
                      </span>
                      <item.icon className="w-5 h-5 text-[var(--text-primary)]" />
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--text-primary)] mb-3">
                      {item.title}
                    </h3>

                    <p className="font-sans text-sm sm:text-base leading-relaxed text-[var(--text-secondary)] mb-8">
                      {item.description}
                    </p>
                  </div>

                  <div className="p-3.5 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[6px] flex items-center justify-between">
                    <div>
                      <span className="block font-mono text-[0.625rem] font-medium uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">
                        {item.statusLabel}
                      </span>
                      <span className="font-sans text-xs font-medium text-[var(--text-primary)]">
                        {item.statusValue}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#ef4639] animate-live-breathe shrink-0 ml-3" />
                  </div>
                </CardSpotlight>
              </MagneticSkew>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
