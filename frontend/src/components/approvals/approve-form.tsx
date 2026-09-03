"use client"

import * as React from "react"
import { CircleCheck, Loader2 } from "lucide-react"

import { PlatformSelector } from "@/components/approvals/platform-selector"
import { ScheduleDateTimePicker } from "@/components/approvals/schedule-date-time-picker"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useNow } from "@/hooks/use-now"
import type { Platform } from "@/lib/types/platform"
import type { Script } from "@/lib/types/script"

export function ApproveForm({
  script,
  isSubmitting,
  onApprove,
  onReject,
}: {
  script: Script
  isSubmitting: boolean
  onApprove: (input: {
    scheduledAt: Date
    targetPlatforms: Platform[]
  }) => void
  onReject: () => void
}) {
  const now = useNow()

  const [scheduledAt, setScheduledAt] = React.useState<Date | null>(() =>
    script.scheduledAt ? new Date(script.scheduledAt) : null
  )
  const [platforms, setPlatforms] = React.useState<Platform[]>(
    // Fall back to the platforms the model suggested for this script.
    script.targetPlatforms.length ? script.targetPlatforms : ["FACEBOOK"]
  )

  const isFuture = scheduledAt ? scheduledAt.getTime() > now : false
  const canApprove = isFuture && platforms.length > 0 && !isSubmitting

  return (
    <div className="space-y-4">
      <Separator />

      <div className="space-y-3">
        <Label>Schedule</Label>
        <ScheduleDateTimePicker
          value={scheduledAt}
          onChange={setScheduledAt}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-3">
        <Label>Publish to</Label>
        <PlatformSelector
          value={platforms}
          onChange={setPlatforms}
          disabled={isSubmitting}
        />
        {platforms.length === 0 && (
          <p className="text-xs text-destructive">Pick at least one platform.</p>
        )}
      </div>

      <Separator />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="destructive"
          onClick={onReject}
          disabled={isSubmitting}
        >
          Disapprove
        </Button>
        <Button
          disabled={!canApprove}
          onClick={() =>
            scheduledAt && onApprove({ scheduledAt, targetPlatforms: platforms })
          }
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <CircleCheck />
          )}
          Approve &amp; schedule
        </Button>
      </div>
    </div>
  )
}
