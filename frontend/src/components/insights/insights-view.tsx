"use client"

import * as React from "react"
import { ChartLine, Lightbulb, TriangleAlert } from "lucide-react"

import {
  EngagementOverTimeChart,
  PlatformPerformanceChart,
  TopTopicsChart,
} from "@/components/insights/performance-charts"
import { InsightsRunStrip } from "@/components/insights/insights-run-strip"
import { InsightsTable } from "@/components/insights/insights-table"
import { ScriptPerformanceTable } from "@/components/insights/script-performance-table"
import { StatCards } from "@/components/insights/stat-cards"
import { StylePlaybookPanel } from "@/components/insights/style-playbook-panel"
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
import {
  getMetricsOverview,
  listInsights,
  listScriptPerformance,
} from "@/lib/api/metrics"

const PAGE_SIZE = 10

export function InsightsView() {
  const [page, setPage] = React.useState(1)
  const [refreshKey, setRefreshKey] = React.useState(0)

  const overview = useAsyncData(() => getMetricsOverview(), [refreshKey])
  const insights = useAsyncData(() => listInsights(), [refreshKey])
  const performance = useAsyncData(
    () => listScriptPerformance({ page, pageSize: PAGE_SIZE }),
    [page, refreshKey]
  )

  const handleRunFinished = React.useCallback(() => {
    setRefreshKey((current) => current + 1)
  }, [])

  const isLoading = overview.isLoading || insights.isLoading
  const error = overview.error ?? insights.error ?? performance.error
  const hasPublishedPosts = (overview.data?.summary.totalPosts ?? 0) > 0

  const rows = performance.data?.rows ?? []
  const totalPages = Math.max(
    1,
    Math.ceil((performance.data?.total ?? 0) / PAGE_SIZE)
  )

  return (
    <PageTransition className="space-y-6 pb-20">
      <PageHeader
        title="Insights"
        description="How published videos are performing, and what the script writer has learned from them."
      />

      <InsightsRunStrip onFinished={handleRunFinished} />

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
            <Button variant="outline" onClick={handleRunFinished}>
              Try again
            </Button>
          }
        />
      ) : !hasPublishedPosts ? (
        <>
          <EmptyState
            icon={ChartLine}
            title="No performance data yet"
            description="Once videos publish and the daily sync reads their engagement, charts, per-video scores and style guidance will appear here."
            action={
              <LinkButton variant="outline" href="/approvals">
                View approvals
              </LinkButton>
            }
          />
          <StylePlaybookPanel refreshKey={refreshKey} />
        </>
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

          {rows.length > 0 && (
            <ScriptPerformanceTable
              rows={rows}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}

          {insights.data && insights.data.length > 0 ? (
            <InsightsTable insights={insights.data} />
          ) : (
            <EmptyState
              icon={Lightbulb}
              title="No recommendations yet"
              description="The weekly style review compares hooks, pacing and outros against engagement. It needs fifteen videos live for three days or more before it will draw conclusions."
            />
          )}

          <StylePlaybookPanel refreshKey={refreshKey} />
        </div>
      )}
    </PageTransition>
  )
}
