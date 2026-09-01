import type { Platform, PlatformPost } from "./platform"
import type { Topic } from "./topic"

export const SCRIPT_STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "PROCESSING",
  "POSTED",
  "FAILED",
  "REJECTED",
] as const

export type ScriptStatus = (typeof SCRIPT_STATUSES)[number]

// A generated script plus its per-platform captions. 
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

  status: ScriptStatus
  scheduledAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null

  processingStartedAt: string | null
  processingAttempts: number
  lastError: string | null

  heygenVideoId: string | null
  heygenVideoUrl: string | null
  videoStorageUrl: string | null

  posts?: PlatformPost[]

  createdAt: string
  updatedAt: string
}

// Fields the reviewer may lightly edit before approving
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
