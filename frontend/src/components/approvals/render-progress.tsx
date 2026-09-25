"use client"

import * as React from "react"
import { Clapperboard } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { getRenderStatus } from "@/lib/api/scripts"
import type { Script } from "@/lib/types/script"

const POLL_INTERVAL_MS = 5000

export function RenderProgress({
  script,
  onFinished,
}: {
  script: Script
  onFinished: (updated: Script) => void
}) {
  const onFinishedRef = React.useRef(onFinished)
  React.useEffect(() => {
    onFinishedRef.current = onFinished
  })

  React.useEffect(() => {
    if (script.status !== "RENDERING") return

    let cancelled = false

    const timer = setInterval(async () => {
      try {
        const latest = await getRenderStatus(script.id)
        if (cancelled) return
        if (latest.status !== "RENDERING") onFinishedRef.current(latest)
      } catch {
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [script.id, script.status])

  return (
    <div className="space-y-4">
      <Separator />

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
        <Clapperboard className="size-7 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">HeyGen is rendering the video</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            This usually takes a few minutes. You can close this and come back —
            the video lands in Review video when it&apos;s ready.
          </p>
        </div>
      </div>
    </div>
  )
}
