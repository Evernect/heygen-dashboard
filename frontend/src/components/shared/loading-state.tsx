import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <Empty className={cn("py-14", className)}>
      <EmptyHeader>
        <EmptyMedia>
          <Spinner className="size-6 text-muted-foreground" />
        </EmptyMedia>
        <EmptyDescription>{label}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function LoadingStrip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </div>
  )
}

export function ErrorStrip({
  title,
  error,
  onRetry,
  isRetrying,
}: {
  title: string
  error: Error
  onRetry: () => void | Promise<void>
  isRetrying?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
      <RetryButton onRetry={onRetry} isRetrying={isRetrying} />
    </div>
  )
}

export function RetryButton({
  onRetry,
  isRetrying = false,
}: {
  onRetry: () => void | Promise<void>
  isRetrying?: boolean
}) {
  return (
    <Button
      variant="outline"
      onClick={() => void onRetry()}
      disabled={isRetrying}
    >
      {isRetrying ? <Spinner /> : <RotateCcw />}
      {isRetrying ? "Trying again…" : "Try again"}
    </Button>
  )
}
