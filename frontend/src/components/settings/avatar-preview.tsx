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
    "relative flex aspect-3/4 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted",
    className
  )

  if (isLoading) return <Skeleton className={cn(frame, "border-0")} />

  if (!look) {
    return (
      <div className={frame}>
        <div className="flex flex-col items-center gap-1.5 px-3 text-center text-muted-foreground">
          <UserRound className="size-6" />
          <span className="text-[11px] leading-tight">No avatar selected</span>
        </div>
      </div>
    )
  }

  const hasImage = Boolean(look.previewImageUrl) && !failed

  return (
    <div className={frame}>
      {hasImage ? (
        <img
          src={look.previewImageUrl ?? ""}
          alt={`Preview of ${look.name}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover object-top"
        />
      ) : (
        <div className="flex flex-col items-center gap-1.5 px-3 pb-6 text-center text-muted-foreground">
          <ImageOff className="size-6" />
          <span className="text-[11px] leading-tight">No preview</span>
        </div>
      )}

      {look.status && look.status !== "completed" && (
        <Badge
          variant="secondary"
          className="absolute top-1.5 left-1.5 text-[10px]"
        >
          {look.status}
        </Badge>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-2.5 pt-8 pb-2",
          hasImage
            ? "bg-linear-to-t from-black/75 via-black/45 to-transparent"
            : "pt-0"
        )}
      >
        <p
          title={look.name}
          className={cn(
            "truncate text-center text-[11px] font-medium",
            hasImage ? "text-white" : "text-muted-foreground"
          )}
        >
          {look.name}
        </p>
      </div>
    </div>
  )
}
