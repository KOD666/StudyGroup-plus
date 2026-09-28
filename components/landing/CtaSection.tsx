"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { KineticReveal } from "@/components/motion/KineticReveal";
import { MagneticSkew } from "@/components/motion/MagneticSkew";
import { ArrowHover } from "@/components/motion/ArrowHover";

export function CtaSection() {
  return (
    <section className="py-24 sm:py-32 bg-[var(--bg-inset)] border-t border-[var(--border-hairline)] relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-widest text-[var(--text-secondary)] block mb-4">
            Get Started Today
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.12] font-normal text-[var(--text-primary)] tracking-tight mb-6">
            <KineticReveal
              text="Start your study group in minutes."
              delay={0.08}
            />
          </h2>

          <p className="font-sans text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            No downloads or meeting links required. Just a permanent study space
            for your class, reading group, or research team.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-5">
            <MagneticSkew transformFactor={0.15} rotateFactor={0.1}>
              <Link href="/sign-up">
                <Button
                  variant="primary"
                  size="lg"
                  className="px-8 magnetic-cta font-medium"
                >
                  Create a Study Group
                </Button>
              </Link>
            </MagneticSkew>
            <MagneticSkew transformFactor={0.12} rotateFactor={0.08}>
              <Link href="/sign-in">
                <Button
                  variant="secondary"
                  size="lg"
                  className="px-8 font-medium inline-flex items-center gap-2 group cursor-element"
                >
                  <span>Sign In to Workspace</span>
                  <ArrowHover size={16} />
                </Button>
              </Link>
            </MagneticSkew>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
