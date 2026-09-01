import type { ScriptStatus } from "@/lib/types/script"
import type { TopicStatus } from "@/lib/types/topic"

export interface StatusMeta {
  label: string
  className: string
  dotClassName: string
}

export const SCRIPT_STATUS_META: Record<ScriptStatus, StatusMeta> = {
  PENDING_REVIEW: {
    label: "Pending",
    className:
      "ring-1 bg-status-pending/12 text-status-pending-foreground dark:text-status-pending ring-status-pending/25",
    dotClassName: "bg-status-pending",
  },
  APPROVED: {
    label: "Approved",
    className:
      "ring-1 bg-status-approved/12 text-status-approved-foreground dark:text-status-approved ring-status-approved/25",
    dotClassName: "bg-status-approved",
  },
  PROCESSING: {
    label: "Processing",
    className:
      "ring-1 bg-status-processing/12 text-status-processing-foreground dark:text-status-processing ring-status-processing/25",
    dotClassName: "bg-status-processing",
  },
  POSTED: {
    label: "Posted",
    className:
      "ring-1 bg-status-posted/12 text-status-posted-foreground dark:text-status-posted ring-status-posted/25",
    dotClassName: "bg-status-posted",
  },
  FAILED: {
    label: "Failed",
    className:
      "ring-1 bg-status-failed/12 text-status-failed-foreground dark:text-status-failed ring-status-failed/25",
    dotClassName: "bg-status-failed",
  },
  REJECTED: {
    label: "Disapproved",
    className:
      "ring-1 bg-status-rejected/12 text-status-rejected-foreground dark:text-status-rejected ring-status-rejected/25",
    dotClassName: "bg-status-rejected",
  },
}

export const TOPIC_STATUS_META: Record<TopicStatus, StatusMeta> = {
  IDLE: {
    label: "Idle",
    className: "ring-1 bg-muted text-muted-foreground ring-border",
    dotClassName: "bg-muted-foreground/60",
  },
  GENERATING: {
    label: "Generating",
    className:
      "ring-1 bg-status-processing/12 text-status-processing-foreground dark:text-status-processing ring-status-processing/25",
    dotClassName: "bg-status-processing",
  },
  GENERATED: {
    label: "Generated",
    className:
      "ring-1 bg-status-approved/12 text-status-approved-foreground dark:text-status-approved ring-status-approved/25",
    dotClassName: "bg-status-approved",
  },
  ERROR: {
    label: "Error",
    className:
      "ring-1 bg-status-failed/12 text-status-failed-foreground dark:text-status-failed ring-status-failed/25",
    dotClassName: "bg-status-failed",
  },
}

export const APPROVAL_TABS: { value: ScriptStatus | "ALL"; label: string }[] = [
  { value: "PENDING_REVIEW", label: "Pending" },
  { value: "APPROVED", label: "Scheduled" },
  { value: "PROCESSING", label: "Processing" },
  { value: "POSTED", label: "Posted" },
  { value: "FAILED", label: "Failed" },
  { value: "REJECTED", label: "Disapproved" },
  { value: "ALL", label: "All" },
]
