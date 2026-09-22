"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Settings,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ReferenceDeskSection() {
  const deskItems = [
    { label: "Primary Documents", count: "2 Active", icon: FileText },
    { label: "Working Notes", count: "2 Items", icon: FileSpreadsheet },
  ];

  return (
    <section id="workspace" className="py-20 md:py-28 bg-[var(--bg-primary)] border-t border-[var(--border-hairline)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Descriptive text and feature bullets (capped at 2) */}
          <div className="lg:col-span-6">
            <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--text-secondary)] block mb-3">
              Document Workspace
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[var(--text-primary)] tracking-tight mb-5">
              Built for real study, not endless chat.
            </h2>
            <p className="font-sans text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
              Every study group includes a shared workspace with your reading materials, working notes,
              and meeting records kept organized across the entire semester.
            </p>

            {/* Feature Bullets (capped at 2 items) */}
            <div className="space-y-5 mb-10">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-[6px] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] mt-1 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                    Shared Reading Documents
                  </h4>
                  <p className="font-sans text-sm text-[var(--text-secondary)]">
                    Read, annotate, and highlight PDFs and Markdown notes side-by-side with peers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-[6px] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] mt-1 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-semibold text-[var(--text-primary)]">
                    Meeting Records &amp; Transcripts
                  </h4>
                  <p className="font-sans text-sm text-[var(--text-secondary)]">
                    Live discussion transcripts and session summaries saved directly to your workspace.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/lounges">
              <Button variant="primary" size="md" className="magnetic-cta">
                Open Study Workspace
              </Button>
            </Link>
          </div>

          {/* Right Column: Reference Desk Component Preview (capped at 2 items) */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="lg:col-span-6"
          >
            <div className="bg-[var(--bg-elevated)] rounded-[10px] border border-[var(--border-hairline)] p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-overlay)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-xs font-bold text-[var(--text-primary)]">
                    SG+
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                      Group Library &amp; Files
                    </h3>
                    <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-[var(--text-secondary)]">
                      PHIL 302 Workspace
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[var(--bg-overlay)] border border-[var(--border-hairline)] font-mono text-[0.625rem] font-medium uppercase tracking-wider text-[var(--text-primary)]">
                  <Plus className="w-3 h-3" /> New Note
                </span>
              </div>

              {/* Items List (capped at 2 items) */}
              <div className="divide-y divide-[var(--border-hairline)] my-2">
                {deskItems.map((item) => (
                  <div
                    key={item.label}
                    className="py-3.5 flex items-center justify-between group hover:bg-[var(--bg-overlay)]/40 px-2 rounded-[4px] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" />
                      <span className="font-sans text-sm font-medium text-[var(--text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desk Footer Actions */}
              <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--text-primary)]" /> Export Files
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[var(--text-secondary)]" /> Group Settings
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
