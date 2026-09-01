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

const QUICK_SLOTS = [
  { label: "Tomorrow, 9:00 AM", hour: 9 },
  { label: "Tomorrow, 2:00 PM", hour: 14 },
  { label: "Tomorrow, 8:00 PM", hour: 20 },
]

function tomorrowAt(hour: number) {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(hour, 0, 0, 0)
  return date
}

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
        <div className="flex flex-wrap gap-1.5">
          {QUICK_SLOTS.map((slot) => (
            <Button
              key={slot.label}
              type="button"
              variant="outline"
              size="xs"
              disabled={isSubmitting}
              onClick={() => setScheduledAt(tomorrowAt(slot.hour))}
            >
              {slot.label}
            </Button>
          ))}
        </div>
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
