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
    <section id="workspace" className="py-20 md:py-28 bg-[#fdf8f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Descriptive text and feature bullets (capped at 2) */}
          <div className="lg:col-span-6">
            <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#78746d] block mb-3">
              Document Workspace
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#171615] tracking-tight mb-5">
              Built for real study, not endless chat.
            </h2>
            <p className="font-sans text-base sm:text-lg text-[#5e5a54] leading-relaxed mb-8">
              Every study group includes a shared workspace with your reading materials, working notes,
              and meeting records kept organized across the entire semester.
            </p>

            {/* Feature Bullets (capped at 2 items) */}
            <div className="space-y-5 mb-10">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-[0.25rem] bg-[#f4f2eb] border border-[#e5e2d9] text-[#234338] mt-1 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-semibold text-[#171615]">
                    Shared Reading Documents
                  </h4>
                  <p className="font-sans text-sm text-[#5e5a54]">
                    Read, annotate, and highlight PDFs and Markdown notes side-by-side with peers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 rounded-[0.25rem] bg-[#f4f2eb] border border-[#e5e2d9] text-[#ba5d1a] mt-1 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-sans text-sm font-semibold text-[#171615]">
                    Meeting Records &amp; Transcripts
                  </h4>
                  <p className="font-sans text-sm text-[#5e5a54]">
                    Live discussion transcripts and session summaries saved directly to your workspace.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/lounges">
              <Button variant="primary" size="md">
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
            <div className="bg-[#f6f4ed] rounded-[0.25rem] border border-[#ddd8cc] p-6 sm:p-8 shadow-paper-contact">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e2d9]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[0.25rem] bg-[#c4e8d8]/60 border border-[#234338]/30 flex items-center justify-center font-serif text-xs font-bold text-[#234338]">
                    SG+
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[#171615]">
                      Group Library &amp; Files
                    </h3>
                    <p className="font-sans text-[0.6875rem] uppercase tracking-[0.08em] text-[#78746d]">
                      PHIL 302 Workspace
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[0.125rem] bg-[#ffffff] border border-[#ddd8cc] font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#ba5d1a]">
                  <Plus className="w-3 h-3" /> New Note
                </span>
              </div>

              {/* Items List (capped at 2 items) */}
              <div className="divide-y divide-[#e5e2d9]/70 my-2">
                {deskItems.map((item) => (
                  <div
                    key={item.label}
                    className="py-3.5 flex items-center justify-between group hover:bg-[#ffffff]/60 px-2 rounded-[0.125rem] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-[#78746d] group-hover:text-[#ba5d1a] transition-colors" />
                      <span className="font-sans text-sm font-medium text-[#171615]">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-editorial italic text-xs text-[#78746d]">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Desk Footer Actions */}
              <div className="pt-4 border-t border-[#e5e2d9] flex items-center justify-between text-xs font-sans text-[#5e5a54]">
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-[#171615] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#ba5d1a]" /> Export Files
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 hover:text-[#171615] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#78746d]" /> Group Settings
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
