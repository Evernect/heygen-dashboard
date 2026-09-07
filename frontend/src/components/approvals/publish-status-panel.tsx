"use client"

import { CircleCheck, CircleX, Clock, RotateCcw } from "lucide-react"

import { PlatformBadge } from "@/components/shared/platform-badges"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDateTime } from "@/lib/format"
import { explainPublishError, explainScriptError } from "@/lib/publish-errors"
import type { PlatformPost } from "@/lib/types/platform"
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
  const scriptError = explainScriptError(script.lastError)

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

      {scriptError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-xs font-medium text-destructive">
            Publishing failed
          </p>
          <p className="mt-1 text-sm">{scriptError}</p>
        </div>
      )}

      {posts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Publish results
          </p>
          <Accordion multiple className="rounded-lg border">
            {posts.map((post) => (
              <PublishResultRow key={post.id} post={post} />
            ))}
          </Accordion>
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

function PublishResultRow({ post }: { post: PlatformPost }) {
  const explanation =
    post.status === "FAILED"
      ? explainPublishError(post.error, post.platform)
      : null

  const summary = (
    <div className="flex flex-1 items-center justify-between gap-3">
      <PlatformBadge platform={post.platform} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {post.platformPostId && (
          <span className="font-mono">{post.platformPostId}</span>
        )}
        {post.status === "SUCCESS" ? (
          <CircleCheck className="size-4 text-status-approved" />
        ) : post.status === "FAILED" ? (
          <CircleX className="size-4 text-destructive" />
        ) : (
          <Clock className="size-4" />
        )}
      </div>
    </div>
  )

  if (!explanation) {
    return (
      <div className="flex items-center justify-between gap-3 p-2.5 not-last:border-b">
        {summary}
      </div>
    )
  }

  return (
    <AccordionItem value={post.id} className="not-last:border-b">
      <AccordionTrigger className="gap-3 px-2.5 py-2.5 hover:no-underline">
        {summary}
      </AccordionTrigger>

      <AccordionContent className="px-2.5 pb-3">
        <p className="text-sm">{explanation.summary}</p>

        {explanation.action && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {explanation.action}
          </p>
        )}

        <p className="mt-2.5 font-mono text-[11px] break-words text-muted-foreground/70">
          {explanation.technical}
        </p>
      </AccordionContent>
    </AccordionItem>
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
