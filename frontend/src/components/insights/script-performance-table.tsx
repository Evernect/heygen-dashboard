"use client"

import {
  AnimatedTableBody,
  AnimatedTableRow,
} from "@/components/motion/animated-list"
import { ListPagination } from "@/components/shared/list-pagination"
import { PlatformBadgeList } from "@/components/shared/platform-badges"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCompactNumber, formatDate } from "@/lib/format"
import type {
  HookType,
  PerformanceTier,
  ScriptPerformanceRow,
} from "@/lib/types/metrics"
import { cn } from "@/lib/utils"

const TIER_LABEL: Record<PerformanceTier, string> = {
  TOP: "Top third",
  MID: "Middle",
  BOTTOM: "Bottom third",
  TOO_NEW: "Too new",
}

const TIER_CLASS: Record<PerformanceTier, string> = {
  TOP: "ring-1 ring-inset bg-status-approved/12 text-status-approved-foreground dark:text-status-approved ring-status-approved/25",
  MID: "ring-1 ring-inset bg-muted text-muted-foreground ring-border",
  BOTTOM:
    "ring-1 ring-inset bg-status-pending/12 text-status-pending-foreground dark:text-status-pending ring-status-pending/25",
  TOO_NEW: "ring-1 ring-inset bg-muted/60 text-muted-foreground ring-border",
}

const HOOK_LABEL: Record<HookType, string> = {
  RHETORICAL_QUESTION: "Question",
  BLUNT_CLAIM: "Blunt claim",
  CONTRAST: "Contrast",
  DIRECT_ADDRESS: "Direct address",
}

function formatScore(score: number | null) {
  if (score == null) return "—"
  return score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2)
}

function formatPacing(row: ScriptPerformanceRow) {
  if (row.breakCount == null) return "—"
  if (row.avgBreakDuration == null) return String(row.breakCount)
  return `${row.breakCount} · ${row.avgBreakDuration.toFixed(2)}s`
}

export function ScriptPerformanceTable({
  rows,
  page,
  totalPages,
  onPageChange,
}: {
  rows: ScriptPerformanceRow[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="p-4">
        <CardTitle>Published videos</CardTitle>
        <CardDescription>
          Style measured off each script, scored against engagement within its
          own platform. Videos live under three days are held out of the ranking.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Video</TableHead>
                <TableHead className="w-28">Posted</TableHead>
                <TableHead className="w-32">Platforms</TableHead>
                <TableHead className="w-36">Hook</TableHead>
                <TableHead className="w-24">Words</TableHead>
                <TableHead className="w-28">Pauses</TableHead>
                <TableHead className="w-24">Views</TableHead>
                <TableHead className="w-28">Engagement</TableHead>
                <TableHead className="w-24">Score</TableHead>
                <TableHead className="w-32">Tier</TableHead>
              </TableRow>
            </TableHeader>

            <AnimatedTableBody>
              {rows.map((row) => (
                <AnimatedTableRow key={row.id} className="border-b">
                  <TableCell>
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-medium">{row.script.title}</p>
                      {row.hookFirstWords && (
                        <p className="truncate text-xs text-muted-foreground">
                          {row.hookFirstWords}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatDate(row.postedAt)}
                  </TableCell>

                  <TableCell>
                    <PlatformBadgeList
                      platforms={row.platformsPosted}
                      max={2}
                      short
                    />
                  </TableCell>

                  <TableCell>
                    {row.hookType ? (
                      <Badge variant="outline">{HOOK_LABEL[row.hookType]}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {row.hookWordCount ?? "—"}
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {formatPacing(row)}
                  </TableCell>

                  <TableCell>{formatCompactNumber(row.totalViews)}</TableCell>

                  <TableCell>
                    {formatCompactNumber(row.totalEngagement)}
                  </TableCell>

                  <TableCell className="tabular-nums">
                    {formatScore(row.compositeScore)}
                  </TableCell>

                  <TableCell>
                    <Badge className={cn(TIER_CLASS[row.performanceTier])}>
                      {TIER_LABEL[row.performanceTier]}
                    </Badge>
                  </TableCell>
                </AnimatedTableRow>
              ))}
            </AnimatedTableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="border-t p-3">
            <ListPagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
