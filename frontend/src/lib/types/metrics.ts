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
  "summary",
] as const

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number]
export type InsightConfidence = "low" | "medium" | "high"

// An LLM-produced observation over aggregated post performance
export interface Insight {
  id: string
  category: InsightCategory
  subject: string
  finding: string
  recommendation: string
  confidence: InsightConfidence
  createdAt: string
}
