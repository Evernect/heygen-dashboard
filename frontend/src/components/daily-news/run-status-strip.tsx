"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  Settings2,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { getLatestRun, runNewsPipeline } from "@/lib/api/daily-news"
import { formatRelative } from "@/lib/format"
import type { LatestRunResponse, NewsRun } from "@/lib/types/daily-news"
import { cn } from "@/lib/utils"

const POLL_INTERVAL_MS = 5000

function describeRun(run: NewsRun): string {
  const {
    itemsCreated,
    articlesKept,
    articlesFound,
    feedsFetched,
    feedsFailed,
    clustersScored,
  } = run

  if (run.status === "RUNNING") return "Reading today's feeds…"

  if (run.status === "FAILED") {
    return run.error ?? "The run failed."
  }

  if (itemsCreated > 0) {
    const topics = `${itemsCreated} topic${itemsCreated === 1 ? "" : "s"}`
    return `${topics} from ${articlesKept} article${articlesKept === 1 ? "" : "s"} across ${feedsFetched} feed${feedsFetched === 1 ? "" : "s"}.`
  }

  if (articlesKept === 0 && articlesFound > 0) {
    return `${feedsFetched} feeds fetched, ${articlesFound} articles, none passed the term and place filter.`
  }

  if (feedsFetched === 0 && feedsFailed > 0) {
    return `All ${feedsFailed} feeds failed to load.`
  }

  if (clustersScored > 0) {
    return `${clustersScored} stories scored, none cleared the editorial filters.`
  }

  return "Nothing qualified today."
}

function statusTone(run: NewsRun | null, inProgress: boolean) {
  if (inProgress || run?.status === "RUNNING") {
    return {
      icon: Loader2,
      className: "text-status-processing",
      spin: true,
    }
  }

  if (run?.status === "FAILED") {
    return { icon: AlertTriangle, className: "text-destructive", spin: false }
  }

  if (run?.status === "PARTIAL") {
    return { icon: TriangleAlert, className: "text-status-pending", spin: false }
  }

  return { icon: CheckCircle2, className: "text-status-approved", spin: false }
}

export function RunStatusStrip({ onFinished }: { onFinished: () => void }) {
  const { notifySuccess, notifyError } = useToastFeedback()
  const [isStarting, setIsStarting] = React.useState(false)

  const { data, refetch, setData } = useAsyncData<LatestRunResponse>(
    () => getLatestRun(),
    []
  )

  const run = data?.run ?? null
  const profile = data?.profile ?? null
  const isRunning = Boolean(data?.inProgress) || run?.status === "RUNNING"

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

  async function handleRun() {
    setIsStarting(true)
    try {
      await runNewsPipeline(true)
      notifySuccess(
        "Run started",
        "Reading the feeds takes a couple of minutes."
      )
      setData((current) =>
        current ? { ...current, inProgress: true } : current
      )
      await refetch()
    } catch (caught) {
      notifyError("Could not start the run", caught)
    } finally {
      setIsStarting(false)
    }
  }

  if (data && !profile) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">No campaign set up yet</p>
          <p className="text-sm text-muted-foreground">
            The pipeline needs to know who it is writing for before it can pick
            anything.
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

  const tone = statusTone(run, isRunning)
  const Icon = tone.icon

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Icon
          className={cn("mt-0.5 size-4 shrink-0", tone.className, tone.spin && "animate-spin")}
        />

        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">
            {run ? (
              <>
                {isRunning ? "Running" : "Last run"}
                {!isRunning && run.finishedAt && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    {formatRelative(run.finishedAt)}
                  </span>
                )}
              </>
            ) : (
              "Not run yet"
            )}
          </p>

          <p className="text-sm text-muted-foreground">
            {run
              ? describeRun(run)
              : profile
                ? `Scheduled for ${String(profile.newsRunHour).padStart(2, "0")}:00 ${profile.timezone.split("/").pop()?.replace("_", " ")}.`
                : ""}
          </p>

          {run?.warnings?.map((warning) => (
            <p key={warning} className="text-xs text-muted-foreground">
              {warning}
            </p>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          render={<Link href="/daily-news/setup" />}
          variant="outline"
          size="sm"
          nativeButton={false}
        >
          <Settings2 />
          Sources
        </Button>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="sm"
                variant="brand"
                onClick={() => void handleRun()}
                disabled={isStarting || isRunning || !profile}
              />
            }
          >
            {isStarting || isRunning ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Play />
            )}
            {isRunning ? "Running…" : "Run now"}
          </TooltipTrigger>
          <TooltipContent>
            {profile
              ? "Fetch today's news and pick topics without waiting for the morning run"
              : "Set up the campaign profile first"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
