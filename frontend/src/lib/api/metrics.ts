import { api } from "./client"
import type {
  ActiveGuidance,
  EngagementPoint,
  Insight,
  InsightsProfile,
  InsightsRun,
  InsightsRunKind,
  MetricsSummary,
  PerformanceTier,
  PlatformPerformance,
  ScriptPerformanceRow,
  TopicPerformance,
} from "@/lib/types/metrics"

export interface MetricsOverview {
  summary: MetricsSummary
  engagementOverTime: EngagementPoint[]
  topTopics: TopicPerformance[]
  platformPerformance: PlatformPerformance[]
}

export interface ScriptPerformanceResponse {
  rows: ScriptPerformanceRow[]
  total: number
  page: number
  pageSize: number
}

export interface LatestInsightsRunResponse {
  metrics: InsightsRun | null
  analysis: InsightsRun | null
  profile: InsightsProfile | null
  activeGuidance: ActiveGuidance | null
  inProgress: { metrics: boolean; analysis: boolean }
}

export function getMetricsOverview() {
  return api.get<MetricsOverview>("api/metrics/summary")
}

export function listInsights() {
  return api.get<Insight[]>("api/insights")
}

export function listScriptPerformance(params?: {
  tier?: PerformanceTier | "ALL"
  page?: number
  pageSize?: number
}) {
  return api.get<ScriptPerformanceResponse>("api/insights/performance", {
    query: {
      tier: params?.tier === "ALL" ? undefined : params?.tier,
      page: params?.page,
      pageSize: params?.pageSize,
    },
  })
}

export function getLatestInsightsRun() {
  return api.get<LatestInsightsRunResponse>("api/insights/runs/latest")
}

export function runInsights(kind: InsightsRunKind, force = true) {
  return api.post<{ status: string; kind: InsightsRunKind }>(
    "api/insights/run",
    { kind, force }
  )
}
