"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CampaignProfileSection } from "@/components/daily-news/campaign-profile-section"
import { KeywordsPanel } from "@/components/daily-news/keywords-panel"
import { PositionsPanel } from "@/components/daily-news/positions-panel"
import { PageTransition } from "@/components/motion/page-transition"
import { LinkButton } from "@/components/shared/link-button"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"

export function NewsSetupView() {
  return (
    <PageTransition className="space-y-6 pb-20">
      <PageHeader
        title="News sources"
        description="Everything the morning run reads before it picks anything: who it is writing for, where it looks, and what he has already said."
        action={
          <Button
            render={<Link href="/daily-news" />}
            variant="outline"
            nativeButton={false}
          >
            <ArrowLeft />
            Back to topics
          </Button>
        }
      />

      <CampaignProfileSection />
      <KeywordsPanel />
      <PositionsPanel />

      <p className="text-sm text-muted-foreground">
        Voice guidance moved to{" "}
        <LinkButton variant="link" href="/insights" className="h-auto p-0">
          Insights
        </LinkButton>
        , where it sits next to the performance it is written from.
      </p>
    </PageTransition>
  )
}
