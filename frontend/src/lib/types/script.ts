import type { Platform, PlatformPost } from "./platform"
import type { Topic } from "./topic"

export const SCRIPT_STATUSES = [
  "DRAFT",
  "RENDERING",
  "PENDING_REVIEW",
  "APPROVED",
  "PROCESSING",
  "POSTED",
  "FAILED",
  "REJECTED",
] as const

export type ScriptStatus = (typeof SCRIPT_STATUSES)[number]

export interface Script {
  id: string
  topicId: string
  topic?: Pick<Topic, "id" | "issue" | "angle"> | null

  title: string
  scriptText: string
  facebookCaption: string | null
  instagramCaption: string | null
  youtubeCaption: string | null
  tiktokCaption: string | null
  xPostText: string | null
  hashtags: string[]
  targetPlatforms: Platform[]

  variantIndex: number
  variantLabel: string | null

  status: ScriptStatus
  selectedAt: string | null
  scheduledAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null

  processingStartedAt: string | null
  processingAttempts: number
  lastError: string | null

  renderStartedAt: string | null
  heygenVideoId: string | null
  heygenVideoUrl: string | null
  videoStorageUrl: string | null

  posts?: PlatformPost[]

  createdAt: string
  updatedAt: string
}

export interface ScriptOptionGroup {
  topicId: string
  issue: string
  angle: string
  options: Script[]
}

export function groupScriptsByTopic(scripts: Script[]): ScriptOptionGroup[] {
  const groups = new Map<string, ScriptOptionGroup>()

  for (const script of scripts) {
    const existing = groups.get(script.topicId)
    if (existing) {
      existing.options.push(script)
      continue
    }

    groups.set(script.topicId, {
      topicId: script.topicId,
      issue: script.topic?.issue ?? "Untitled topic",
      angle: script.topic?.angle ?? "",
      options: [script],
    })
  }

  for (const group of groups.values()) {
    group.options.sort((a, b) => a.variantIndex - b.variantIndex)
  }

  return [...groups.values()]
}

export interface UpdateScriptInput {
  title?: string
  scriptText?: string
  facebookCaption?: string | null
  instagramCaption?: string | null
  youtubeCaption?: string | null
  tiktokCaption?: string | null
  xPostText?: string | null
  hashtags?: string[]
}

export interface ApproveScriptInput {
  scheduledAt: string
  targetPlatforms: Platform[]
}

export interface RejectScriptInput {
  reason: string
}
