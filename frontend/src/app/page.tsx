import type { Metadata } from "next"

import { CtaSection } from "@/components/landing/cta-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { HeroSection } from "@/components/landing/hero-section"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingNav } from "@/components/landing/landing-nav"
import { PipelineSection } from "@/components/landing/pipeline-section"

export const metadata: Metadata = {
  title: "ReelFlow | Topic In, Published Reels Out",
  description:
    "ReelFlow turns an issue and an angle into three AI-written scripts, renders the one you pick as an avatar video, and publishes it to your channels on a schedule you approve.",
}

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <PipelineSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  )
}
