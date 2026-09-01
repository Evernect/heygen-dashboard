"use client"

import { CircleCheck, CircleX, Clock, RotateCcw } from "lucide-react"

import { PlatformBadge } from "@/components/shared/platform-badges"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDateTime } from "@/lib/format"
import type { Script } from "@/lib/types/script"


export function PublishStatusPanel({
  script,
  isRetrying,
  onRetry,
}: {
  script: Script
  isRetrying: boolean
  onRetry: () => void
}) {
  const posts = script.posts ?? []

  return (
    <div className="space-y-4">
      <Separator />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Scheduled for" value={formatDateTime(script.scheduledAt)} />
        <Field label="Approved at" value={formatDateTime(script.approvedAt)} />
      </div>

      {script.rejectionReason && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-destructive">
            Disapproval reason
          </p>
          <p className="mt-1 text-sm">{script.rejectionReason}</p>
        </div>
      )}

      {script.lastError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-destructive">Last error</p>
          <p className="mt-1 font-mono text-xs break-words">
            {script.lastError}
          </p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Publish results
          </p>
          <div className="divide-y rounded-lg border">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center justify-between gap-3 p-2.5"
              >
                <PlatformBadge platform={post.platform} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {post.platformPostId && (
                    <span className="font-mono">{post.platformPostId}</span>
                  )}
                  {post.status === "success" ? (
                    <CircleCheck className="size-4 text-status-approved" />
                  ) : post.status === "failed" ? (
                    <CircleX className="size-4 text-destructive" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {script.videoStorageUrl && (
        <a
          href={script.videoStorageUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          View rendered video
        </a>
      )}

      {script.status === "FAILED" && (
        <>
          <Separator />
          <div className="flex justify-end">
            <Button onClick={onRetry} disabled={isRetrying}>
              <RotateCcw className={isRetrying ? "animate-spin" : undefined} />
              Retry publishing
            </Button>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            The rendered video is reused — retrying won&apos;t spend HeyGen
            credits again.
          </p>
        </>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  )
}
