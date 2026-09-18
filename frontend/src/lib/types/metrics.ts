import type { Platform } from "./platform"

export interface MetricsSummary {
  totalViews: number
  totalEngagement: number
  averageEngagement: number
  totalPosts: number
  topTopic: string | null
}

export interface EngagementPoint {
  date: string
  views: number
  likes: number
  comments: number
  shares: number
}

export interface TopicPerformance {
  topicId: string
  issue: string
  views: number
  engagement: number
}

export interface PlatformPerformance {
  platform: Platform
  views: number
  engagement: number
  posts: number
}

export const INSIGHT_CATEGORIES = [
  "topic",
  "content_type",
  "platform",
  "hashtag",
  "style",
  "summary",
] as const

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number]
export type InsightConfidence = "low" | "medium" | "high"

export interface Insight {
  id: string
  category: InsightCategory
  subject: string
  finding: string
  recommendation: string
  confidence: InsightConfidence
  runId: string | null
  createdAt: string
}

export const PERFORMANCE_TIERS = ["TOP", "MID", "BOTTOM", "TOO_NEW"] as const
export type PerformanceTier = (typeof PERFORMANCE_TIERS)[number]

export type HookType =
  | "RHETORICAL_QUESTION"
  | "BLUNT_CLAIM"
  | "CONTRAST"
  | "DIRECT_ADDRESS"

export interface ScriptPerformanceRow {
  id: string
  scriptId: string
  postedAt: string | null
  platformsPosted: Platform[]

  hookType: HookType | null
  hookFirstWords: string | null
  hookWordCount: number | null
  outroLeadIn: string | null
  breakCount: number | null
  avgBreakDuration: number | null
  sentenceVarietyScore: number | null
  styleTaggedAt: string | null

  totalViews: number
  totalEngagement: number
  compositeScore: number | null
  performanceTier: PerformanceTier

  lastComputedAt: string
  script: {
    id: string
    title: string
    variantLabel: string | null
    topic: { id: string; issue: string } | null
  }
}

export type InsightsRunKind = "METRICS" | "ANALYSIS"

export type InsightsRunStatus =
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED"
  | "SKIPPED"

export interface InsightsRun {
  id: string
  localDate: string
  kind: InsightsRunKind
  trigger: "CRON" | "MANUAL"
  status: InsightsRunStatus
  attempt: number
  startedAt: string
  finishedAt: string | null

  postsPolled: number
  postsFailed: number
  metricsWritten: number
  scriptsTagged: number
  scriptsScored: number
  sampleSize: number

  playbookId: string | null
  warnings: string[]
  error: string | null
}

export interface InsightsProfile {
  candidateName: string
  timezone: string
  insightsEnabled: boolean
  metricsRunHour: number
  analysisWeekday: number
  analysisRunHour: number
}

export interface ActiveGuidance {
  id: string
  label: string | null
  guidance: string
  sampleSize: number | null
  createdAt: string
}
