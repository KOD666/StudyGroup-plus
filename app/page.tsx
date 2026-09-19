import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { ReferenceDeskSection } from "@/components/landing/ReferenceDeskSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fdf8f6] flex flex-col selection:bg-[#ffdbc9] selection:text-[#171615]">
      <LandingHeader />
      <div className="flex-1">
        <HeroSection />
        <ArchitectureSection />
        <TestimonialSection />
        <ReferenceDeskSection />
        <CtaSection />
      </div>
      <LandingFooter />
    </main>
  );
}
