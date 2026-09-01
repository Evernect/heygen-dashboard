import { Badge } from "@/components/ui/badge"
import { PLATFORM_META } from "@/lib/constants/platforms"
import type { Platform } from "@/lib/types/platform"
import { cn } from "@/lib/utils"

export function PlatformBadge({
  platform,
  className,
}: {
  platform: Platform
  className?: string
}) {
  const meta = PLATFORM_META[platform]

  return (
    <Badge variant="outline" className={cn("gap-1.5", className)}>
      <span className={cn("size-1.5 rounded-full", meta.dotClassName)} />
      {meta.label}
    </Badge>
  )
}

export function PlatformBadgeList({
  platforms,
  max = 3,
  className,
}: {
  platforms: Platform[]
  max?: number
  className?: string
}) {
  if (!platforms.length) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = platforms.slice(0, max)
  const overflow = platforms.length - visible.length

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visible.map((platform) => (
        <PlatformBadge key={platform} platform={platform} />
      ))}
      {overflow > 0 && (
        <Badge variant="secondary" className="tabular-nums">
          +{overflow}
        </Badge>
      )}
    </div>
  )
}
