"use client"

import { ExternalLink, Film } from "lucide-react"

import { Label } from "@/components/ui/label"

export function VideoPreview({
  videoUrl,
  poster,
}: {
  videoUrl: string
  poster?: string
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <Film className="size-3.5" />
          Video preview
        </Label>
        <a
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Open in new tab
          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="flex justify-center rounded-xl border bg-muted/30 p-3">
        <video
          key={videoUrl}
          src={videoUrl}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          className="max-h-[60vh] w-auto max-w-full rounded-lg bg-black shadow-sm"
        />
      </div>
    </section>
  )
}
