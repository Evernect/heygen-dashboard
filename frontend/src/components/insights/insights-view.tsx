"use client"

import { ChartLine, Lightbulb, TriangleAlert } from "lucide-react"

import {
  EngagementOverTimeChart,
  PlatformPerformanceChart,
  TopTopicsChart,
} from "@/components/insights/performance-charts"
import { InsightsTable } from "@/components/insights/insights-table"
import { StatCards } from "@/components/insights/stat-cards"
import { PageTransition } from "@/components/motion/page-transition"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { LinkButton } from "@/components/shared/link-button"
import {
  ChartSkeleton,
  StatCardsSkeleton,
} from "@/components/shared/loading-skeletons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { useAsyncData } from "@/hooks/use-async-data"
import { getMetricsOverview, listInsights } from "@/lib/api/metrics"

export function InsightsView() {
  const overview = useAsyncData(() => getMetricsOverview(), [])
  const insights = useAsyncData(() => listInsights(), [])

  const isLoading = overview.isLoading || insights.isLoading
  const error = overview.error ?? insights.error
  const hasPublishedPosts = (overview.data?.summary.totalPosts ?? 0) > 0

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Insights"
        description="How published videos are performing across platforms."
      />

      {isLoading ? (
        <div className="space-y-6">
          <StatCardsSkeleton />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          icon={TriangleAlert}
          title="Could not load insights"
          description={error.message}
          action={
            <Button
              variant="outline"
              onClick={() => {
                void overview.refetch()
                void insights.refetch()
              }}
            >
              Try again
            </Button>
          }
        />
      ) : !hasPublishedPosts ? (
        <EmptyState
          icon={ChartLine}
          title="No performance data yet"
          description="Once videos publish and their metrics sync, engagement charts and recommendations will appear here."
          action={
            <LinkButton variant="outline" href="/approvals">
              View approvals
            </LinkButton>
          }
        />
      ) : (
        <div className="space-y-6">
          {overview.data && <StatCards summary={overview.data.summary} />}

          {overview.data && overview.data.engagementOverTime.length > 0 && (
            <EngagementOverTimeChart data={overview.data.engagementOverTime} />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {overview.data && overview.data.topTopics.length > 0 && (
              <TopTopicsChart data={overview.data.topTopics} />
            )}
            {overview.data && overview.data.platformPerformance.length > 0 && (
              <PlatformPerformanceChart
                data={overview.data.platformPerformance}
              />
            )}
          </div>

          {insights.data && insights.data.length > 0 ? (
            <InsightsTable insights={insights.data} />
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="No recommendations yet"
              description="The analysis runs over published performance data once there's enough of it to say something useful."
            />
          )}
        </div>
      )}
    </PageTransition>
  )
}
