import { Badge } from "@/components/ui/badge"
import { PLATFORM_META } from "@/lib/constants/platforms"
import type { Platform } from "@/lib/types/platform"
import { cn } from "@/lib/utils"

export function PlatformBadge({
  platform,
  className,
  short = false,
}: {
  platform: Platform
  className?: string
  short?: boolean
}) {
  const meta = PLATFORM_META[platform]

  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClassName)} />
      {short ? meta.short : meta.label}
    </Badge>
  )
}

export function PlatformBadgeList({
  platforms,
  max = 3,
  className,
  short = false,
}: {
  platforms: Platform[]
  max?: number
  className?: string
  short?: boolean
}) {
  if (!platforms.length) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = platforms.slice(0, max)
  const overflow = platforms.length - visible.length

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible.map((platform) => (
        <PlatformBadge key={platform} platform={platform} short={short} />
      ))}
      {overflow > 0 && (
        <Badge variant="secondary" className="tabular-nums">
          +{overflow}
        </Badge>
      )}
    </div>
  )
}
