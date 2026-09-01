import { api } from "./client"
import type {
  EngagementPoint,
  Insight,
  MetricsSummary,
  PlatformPerformance,
  TopicPerformance,
} from "@/lib/types/metrics"

export interface MetricsOverview {
  summary: MetricsSummary
  engagementOverTime: EngagementPoint[]
  topTopics: TopicPerformance[]
  platformPerformance: PlatformPerformance[]
}

export function getMetricsOverview() {
  return api.get<MetricsOverview>("api/metrics/summary")
}

export function listInsights() {
  return api.get<Insight[]>("api/insights")
}
