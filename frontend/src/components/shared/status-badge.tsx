import { Badge } from "@/components/ui/badge"
import { SCRIPT_STATUS_META, TOPIC_STATUS_META } from "@/lib/constants/statuses"
import type { ScriptStatus } from "@/lib/types/script"
import type { TopicStatus } from "@/lib/types/topic"
import { cn } from "@/lib/utils"

function StatusDot({ className }: { className: string }) {
  return <span className={cn("size-1.5 rounded-full", className)} />
}

export function ScriptStatusBadge({
  status,
  className,
}: {
  status: ScriptStatus
  className?: string
}) {
  const meta = SCRIPT_STATUS_META[status]

  return (
    <Badge className={cn(meta.className, "gap-1.5 ring-inset", className)}>
      <StatusDot
        className={cn(
          meta.dotClassName,
          status === "PROCESSING" && "animate-pulse"
        )}
      />
      {meta.label}
    </Badge>
  )
}

export function TopicStatusBadge({
  status,
  className,
}: {
  status: TopicStatus
  className?: string
}) {
  const meta = TOPIC_STATUS_META[status]

  return (
    <Badge className={cn(meta.className, "gap-1.5 ring-inset", className)}>
      <StatusDot
        className={cn(
          meta.dotClassName,
          status === "GENERATING" && "animate-pulse"
        )}
      />
      {meta.label}
    </Badge>
  )
}
