"use client"

import * as React from "react"
import { ImageOff, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { HeygenAvatarLook } from "@/lib/types/settings"

export function AvatarPreview({
  look,
  isLoading,
  className,
}: {
  look: HeygenAvatarLook | null
  isLoading?: boolean
  className?: string
}) {
  const [failed, setFailed] = React.useState(false)

  const [lastId, setLastId] = React.useState(look?.id ?? null)
  if ((look?.id ?? null) !== lastId) {
    setLastId(look?.id ?? null)
    setFailed(false)
  }

  const frame = cn(
    "relative flex aspect-9/16 w-full max-w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted",
    className
  )

  if (isLoading) return <Skeleton className={cn(frame, "border-0")} />

  if (!look) {
    return (
      <div className={frame}>
        <div className="flex flex-col items-center gap-1.5 px-2 text-center text-muted-foreground">
          <UserRound className="size-5" />
          <span className="text-[11px] leading-tight">No avatar selected</span>
        </div>
      </div>
    )
  }

  return (
    <figure className="flex flex-col items-center gap-2">
      <div className={frame}>
        {look.previewImageUrl && !failed ? (
          <img
            src={look.previewImageUrl}
            alt={`Preview of ${look.name}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-2 text-center text-muted-foreground">
            <ImageOff className="size-5" />
            <span className="text-[11px] leading-tight">No preview</span>
          </div>
        )}

        {look.status && look.status !== "completed" && (
          <Badge
            variant="secondary"
            className="absolute inset-x-1 bottom-1 justify-center text-[10px]"
          >
            {look.status}
          </Badge>
        )}
      </div>

      <figcaption className="max-w-36 text-center text-[11px] leading-tight text-muted-foreground">
        {look.name}
      </figcaption>
    </figure>
  )
}
