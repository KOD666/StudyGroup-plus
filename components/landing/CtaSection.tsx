"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#faf9f6] border-t border-[#e5e2d9]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[#78746d] block mb-3">
            Get Started Today
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.12] font-normal text-[#171615] tracking-tight mb-5">
            Start your study group in minutes.
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#5e5a54] max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            No downloads or meeting links required. Just a permanent study space for your class,
            reading group, or research team.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button variant="primary" size="lg" className="px-8">
                Create a Study Group
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="secondary" size="lg" className="px-8">
                Sign In to Workspace
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
