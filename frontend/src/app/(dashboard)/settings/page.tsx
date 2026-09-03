import type { Metadata } from "next"

import { PageTransition } from "@/components/motion/page-transition"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata: Metadata = {
  title: "Settings | Video Automation",
}

export default function SettingsPage() {
  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Settings"
        description="How scripts are written and how they are rendered. Changes apply to the next run."
      />

      <SettingsForm />
    </PageTransition>
  )
}
