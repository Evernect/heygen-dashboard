"use client"

import { ExternalLink, TriangleAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatRelative } from "@/lib/format"
import type { DailyNewsItem } from "@/lib/types/daily-news"

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

export function NewsItemDetailDialog({
  item,
  onOpenChange,
}: {
  item: DailyNewsItem | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-6">{item.topic}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs">{item.issueCode}</span>
                <span>·</span>
                <span>
                  {item.localDate}
                  {item.localTime ? ` ${item.localTime}` : ""}
                </span>
                {item.publishedAt && (
                  <>
                    <span>·</span>
                    <span>story {formatRelative(item.publishedAt)}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5">
              {item.conflictFlag && (
                <div className="flex items-start gap-2 rounded-lg border border-status-pending/30 bg-status-pending/8 p-3 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-pending" />
                  <p>{item.conflictFlag}</p>
                </div>
              )}

              <Section title="Angle">
                <p className="text-sm">
                  {item.angle || (
                    <span className="italic text-muted-foreground">
                      No angle was written for this topic.
                    </span>
                  )}
                </p>
              </Section>

              <Section title="Why now">
                <p className="text-sm text-muted-foreground">{item.whyNow}</p>
              </Section>

              <Section title="What the reporting says">
                {item.headlinesOnly && (
                  <Badge className="mb-1.5 ring-1 ring-inset bg-muted text-muted-foreground ring-border">
                    Headlines only — no article text was readable
                  </Badge>
                )}
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {item.sourceSummary}
                </p>
              </Section>

              <Section title="Sources">
                {item.unmatched ? (
                  <p className="text-sm text-status-pending-foreground dark:text-status-pending">
                    This topic could not be traced back to a source story.
                    Verify it by hand before generating anything from it.
                  </p>
                ) : item.sourceUrls.length ? (
                  <ul className="space-y-1.5">
                    {item.sourceUrls.map((url) => (
                      <li key={url}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                          <span className="break-all">{url}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No links were captured.
                  </p>
                )}

                {item.headline && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    Lead headline: {item.headline}
                    {item.outlet ? ` (${item.outlet})` : ""}
                  </p>
                )}
              </Section>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
