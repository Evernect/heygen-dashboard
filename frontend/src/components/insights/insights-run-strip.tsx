"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Settings2,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"

import { ErrorStrip, LoadingStrip } from "@/components/shared/loading-state"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  getLatestInsightsRun,
  runInsights,
  type LatestInsightsRunResponse,
} from "@/lib/api/metrics"
import { formatRelative } from "@/lib/format"
import type { InsightsRun, InsightsRunKind } from "@/lib/types/metrics"
import { cn } from "@/lib/utils"

const POLL_INTERVAL_MS = 5000

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`
}

function describeMetrics(run: InsightsRun): string {
  if (run.status === "RUNNING") return "Reading engagement from Facebook and Instagram…"
  if (run.status === "FAILED") return run.error ?? "The sync failed."

  if (run.postsPolled === 0) {
    return "Nothing published yet, so there was nothing to measure."
  }

  const parts = [
    `${plural(run.metricsWritten, "reading")} from ${plural(run.postsPolled, "post")}`,
  ]
  if (run.scriptsScored) parts.push(`${plural(run.scriptsScored, "video")} scored`)
  if (run.scriptsTagged) parts.push(`${plural(run.scriptsTagged, "script")} newly tagged`)

  return `${parts.join(", ")}.`
}

function describeAnalysis(run: InsightsRun): string {
  if (run.status === "RUNNING") return "Comparing what worked against what did not…"
  if (run.status === "FAILED") return run.error ?? "The review failed."

  if (run.playbookId) {
    return `New guidance written from ${plural(run.sampleSize, "video")}, now steering script generation.`
  }

  return `Reviewed ${plural(run.sampleSize, "video")}. No new guidance.`
}

function statusTone(run: InsightsRun | null, inProgress: boolean) {
  if (inProgress || run?.status === "RUNNING") {
    return { icon: Loader2, className: "text-status-processing", spin: true }
  }
  if (run?.status === "FAILED") {
    return { icon: AlertTriangle, className: "text-destructive", spin: false }
  }
  if (run?.status === "PARTIAL") {
    return { icon: TriangleAlert, className: "text-status-pending", spin: false }
  }
  return { icon: CheckCircle2, className: "text-status-approved", spin: false }
}

function zoneLabel(timezone: string) {
  return timezone.split("/").pop()?.replace("_", " ") ?? timezone
}

function RunLine({
  run,
  inProgress,
  label,
  describe,
  schedule,
}: {
  run: InsightsRun | null
  inProgress: boolean
  label: string
  describe: (run: InsightsRun) => string
  schedule: string
}) {
  const isRunning = inProgress || run?.status === "RUNNING"
  const tone = statusTone(run, inProgress)
  const Icon = tone.icon

  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone.className,
          tone.spin && "animate-spin"
        )}
      />

      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">
          {label}
          {run ? (
            <span className="font-normal text-muted-foreground">
              {isRunning
                ? " running now"
                : run.finishedAt
                  ? ` ${formatRelative(run.finishedAt)}`
                  : ""}
            </span>
          ) : (
            <span className="font-normal text-muted-foreground">
              {" "}
              not run yet
            </span>
          )}
        </p>

        <p className="text-sm text-muted-foreground">
          {run ? describe(run) : schedule}
        </p>

        {run?.warnings?.map((warning) => (
          <p key={warning} className="text-xs text-muted-foreground">
            {warning}
          </p>
        ))}
      </div>
    </div>
  )
}

export function InsightsRunStrip({ onFinished }: { onFinished: () => void }) {
  const { notifySuccess, notifyError } = useToastFeedback()
  const [starting, setStarting] = React.useState<InsightsRunKind | null>(null)

  const { data, error, isLoading, isRefreshing, refetch, setData } =
    useAsyncData<LatestInsightsRunResponse>(() => getLatestInsightsRun(), [])

  const profile = data?.profile ?? null
  const metricsRun = data?.metrics ?? null
  const analysisRun = data?.analysis ?? null

  const isRunning =
    Boolean(data?.inProgress.metrics) ||
    Boolean(data?.inProgress.analysis) ||
    metricsRun?.status === "RUNNING" ||
    analysisRun?.status === "RUNNING"

  const wasRunning = React.useRef(false)
  React.useEffect(() => {
    if (!isRunning) {
      if (wasRunning.current) {
        wasRunning.current = false
        onFinished()
      }
      return
    }

    wasRunning.current = true
    const timer = setInterval(() => void refetch(), POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isRunning, refetch, onFinished])

  async function handleRun(kind: InsightsRunKind) {
    setStarting(kind)
    try {
      await runInsights(kind)

      notifySuccess(
        kind === "METRICS" ? "Sync started" : "Review started",
        kind === "METRICS"
          ? "Reading engagement for every published video."
          : "Comparing style against performance."
      )

      setData((current) =>
        current
          ? {
              ...current,
              inProgress: {
                ...current.inProgress,
                [kind === "METRICS" ? "metrics" : "analysis"]: true,
              },
            }
          : current
      )
      await refetch()
    } catch (caught) {
      notifyError("Could not start the run", caught)
    } finally {
      setStarting(null)
    }
  }

  if (isLoading) return <LoadingStrip label="Checking the latest runs…" />

  if (error && !data) {
    return (
      <ErrorStrip
        title="Could not load the run status"
        error={error}
        onRetry={refetch}
        isRetrying={isRefreshing}
      />
    )
  }

  if (data && !profile) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">No campaign set up yet</p>
          <p className="text-sm text-muted-foreground">
            The feedback loop reads the run schedule off the campaign profile,
            so it stays idle until one exists.
          </p>
        </div>
        <Button
          render={<Link href="/daily-news/setup" />}
          variant="brand"
          nativeButton={false}
        >
          <Settings2 />
          Set up
        </Button>
      </div>
    )
  }

  const zone = profile ? zoneLabel(profile.timezone) : ""

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
        <RunLine
          run={metricsRun}
          inProgress={Boolean(data?.inProgress.metrics)}
          label="Engagement sync"
          describe={describeMetrics}
          schedule={
            profile
              ? `Runs daily at ${String(profile.metricsRunHour).padStart(2, "0")}:00 ${zone}.`
              : ""
          }
        />

        <RunLine
          run={analysisRun}
          inProgress={Boolean(data?.inProgress.analysis)}
          label="Style review"
          describe={describeAnalysis}
          schedule={
            profile
              ? `Runs ${WEEKDAYS[profile.analysisWeekday] ?? "weekly"}s at ${String(profile.analysisRunHour).padStart(2, "0")}:00 ${zone}.`
              : ""
          }
        />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleRun("METRICS")}
                disabled={starting !== null || isRunning || !profile}
              />
            }
          >
            {starting === "METRICS" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            Sync now
          </TooltipTrigger>
          <TooltipContent>
            Read engagement for every published video without waiting for the
            morning sync
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                variant="brand"
                onClick={() => void handleRun("ANALYSIS")}
                disabled={starting !== null || isRunning || !profile}
              />
            }
          >
            {starting === "ANALYSIS" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Review style
          </TooltipTrigger>
          <TooltipContent>
            Compare style against performance and write new guidance for the
            script writer
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
