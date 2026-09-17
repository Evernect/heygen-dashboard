"use client"

import { HeygenConnectionPanel } from "@/components/heygen/heygen-connection-panel"
import { SettingsSection } from "@/components/settings/settings-section"
import { Clapperboard } from "lucide-react"

import type { HeygenConnection } from "@/lib/types/heygen"

export function HeygenAccountSection({
  connection,
}: {
  connection: HeygenConnection | null
}) {
  return (
    <SettingsSection
      icon={Clapperboard}
      title="HeyGen"
      description="The account your avatar videos render on. The key is verified against HeyGen before it is saved, and stored encrypted."
    >
      <HeygenConnectionPanel initialConnection={connection} />
    </SettingsSection>
  )
}
