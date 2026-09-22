import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { KineticMarquee } from "@/components/motion/KineticMarquee";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { ReferenceDeskSection } from "@/components/landing/ReferenceDeskSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--text-primary)] selection:text-[var(--bg-primary)]">
      <LandingHeader />
      <div className="flex-1">
        <HeroSection />
        <KineticMarquee
          items={[
            "DEEP FOCUS ROOMS",
            "AI NOTE SYNTHESIS",
            "LATEX SYNC VAULT",
            "LIVEKIT AUDIO MESH",
            "REALTIME TRANSCRIPTS",
            "QUESTION CHECKOUTS",
            "ZERO LATENCY COLLAB",
            "PERSISTENT ARCHIVES",
          ]}
          speed={30}
          tilt={true}
        />
        <ArchitectureSection />
        <TestimonialSection />
        <ReferenceDeskSection />
        <CtaSection />
      </div>
      <LandingFooter />
    </main>
  );
}
