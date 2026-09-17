export const DAILY_NEWS_STATUSES = [
  "NEW",
  "GENERATING",
  "GENERATED",
  "ERROR",
  "DISMISSED",
] as const

export type DailyNewsStatus = (typeof DAILY_NEWS_STATUSES)[number]

export type Importance = "High" | "Medium" | "Low"

export interface DailyNewsItem {
  id: string
  runId: string | null
  issueCode: string
  topic: string
  angle: string
  whyNow: string
  importance: Importance
  importanceScore: number
  sourceSummary: string
  /** The summary came from headlines alone — no article text was readable. */
  headlinesOnly: boolean
  /** Empty when the angle sits consistently with the stated positions. */
  conflictFlag: string | null
  clusterId: string | null
  /** The model named a story that could not be resolved back to its sources. */
  unmatched: boolean
  headline: string | null
  outlet: string | null
  sourceUrls: string[]
  outletCount: number
  publishedAt: string | null
  localDate: string
  localTime: string | null
  status: DailyNewsStatus
  generateError: string | null
  topicId: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedDailyNews {
  items: DailyNewsItem[]
  total: number
  page: number
  pageSize: number
}

export type NewsRunStatus =
  | "RUNNING"
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED"
  | "SKIPPED"

export interface NewsRun {
  id: string
  localDate: string
  trigger: "CRON" | "MANUAL"
  status: NewsRunStatus
  attempt: number
  startedAt: string
  finishedAt: string | null
  keywordsUsed: number
  feedsFetched: number
  feedsFailed: number
  articlesFound: number
  articlesKept: number
  clustersScored: number
  articleTextsFetched: number
  itemsCreated: number
  warnings: string[]
  error: string | null
}

export interface LatestRunResponse {
  run: NewsRun | null
  profile: {
    candidateName: string
    newsEnabled: boolean
    newsRunHour: number
    timezone: string
  } | null
  inProgress: boolean
}

export interface UpdateDailyNewsItemInput {
  topic?: string
  angle?: string
}
