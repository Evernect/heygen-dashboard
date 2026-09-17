"use client"

import * as React from "react"
import { AnimatePresence } from "framer-motion"
import {
  Ban,
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  TriangleAlert,
} from "lucide-react"

import {
  AnimatedTableBody,
  AnimatedTableRow,
} from "@/components/motion/animated-list"
import { DailyNewsStatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DailyNewsItem } from "@/lib/types/daily-news"
import { cn } from "@/lib/utils"

const ROW_LAYOUT =
  "[&>*]:px-3 [&>*]:text-center [&>*:first-child]:pl-4 [&>*:last-child]:pr-4"

const IMPORTANCE_CLASS: Record<string, string> = {
  High: "ring-1 bg-status-failed/10 text-status-failed-foreground dark:text-status-failed ring-status-failed/25",
  Medium: "ring-1 bg-status-pending/10 text-status-pending-foreground dark:text-status-pending ring-status-pending/25",
  Low: "ring-1 bg-muted text-muted-foreground ring-border",
}

export function DailyNewsTable({
  items,
  generatingId,
  onGenerate,
  onView,
  onEdit,
  onDismiss,
  onDelete,
}: {
  items: DailyNewsItem[]
  generatingId: string | null
  onGenerate: (item: DailyNewsItem) => void
  onView: (item: DailyNewsItem) => void
  onEdit: (item: DailyNewsItem) => void
  onDismiss: (item: DailyNewsItem) => void
  onDelete: (item: DailyNewsItem) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table className="min-w-[840px] table-fixed">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[26%]" />
          <col className="w-[10%]" />
          <col className="w-[15%]" />
          <col className="w-[11%]" />
          <col className="w-[14%]" />
        </colgroup>

        <TableHeader>
          <TableRow className={cn(ROW_LAYOUT, "[&>th]:h-11")}>
            <TableHead>Topic</TableHead>
            <TableHead>Angle</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <AnimatedTableBody>
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const isGenerating =
                generatingId === item.id || item.status === "GENERATING"
              const needsAngle = !item.angle.trim()

              return (
                <AnimatedTableRow
                  key={item.id}
                  layout
                  className={cn(
                    ROW_LAYOUT,
                    "border-b transition-colors hover:bg-muted/40 [&>td]:py-3"
                  )}
                >
                  <TableCell className="whitespace-normal text-left! font-medium">
                    <span className="line-clamp-2">{item.topic}</span>
                    <p className="mt-1 font-mono text-[11px] font-normal text-muted-foreground">
                      {item.issueCode}
                    </p>
                    {item.status === "ERROR" && item.generateError && (
                      <p className="mt-1 text-xs font-normal text-destructive">
                        {item.generateError}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-normal text-left! text-muted-foreground">
                    {needsAngle ? (
                      <span className="text-xs italic">
                        No angle was written — add one before generating.
                      </span>
                    ) : (
                      <span className="line-clamp-2">{item.angle}</span>
                    )}

                    {item.conflictFlag && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-status-pending-foreground dark:text-status-pending">
                        <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                        <span className="line-clamp-2">{item.conflictFlag}</span>
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Badge
                            className={cn(
                              IMPORTANCE_CLASS[item.importance] ??
                                IMPORTANCE_CLASS.Low,
                              "ring-inset"
                            )}
                          />
                        }
                      >
                        {item.importance}
                      </TooltipTrigger>
                      <TooltipContent>
                        Editorial judgement. Story score: {item.importanceScore}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell className="whitespace-normal text-left! text-xs text-muted-foreground">
                    {item.unmatched ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="cursor-default font-medium text-status-pending-foreground dark:text-status-pending" />
                          }
                        >
                          Source unresolved
                        </TooltipTrigger>
                        <TooltipContent>
                          Verify this one by hand before generating
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <>
                        <span className="line-clamp-1">
                          {item.outlet ?? "—"}
                        </span>
                        {item.outletCount > 1 && (
                          <span className="text-[11px]">
                            +{item.outletCount - 1} more outlet
                            {item.outletCount > 2 ? "s" : ""}
                          </span>
                        )}
                        {item.headlinesOnly && (
                          <span className="block text-[11px] italic">
                            headlines only
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>

                  <TableCell>
                    <DailyNewsStatusBadge status={item.status} />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onGenerate(item)}
                              disabled={isGenerating || needsAngle}
                            />
                          }
                        >
                          {isGenerating ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Sparkles />
                          )}
                          {isGenerating ? "Generating" : "Generate"}
                        </TooltipTrigger>
                        <TooltipContent>
                          {needsAngle
                            ? "Add an angle first"
                            : "Generate three script options from this topic"}
                        </TooltipContent>
                      </Tooltip>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="More actions"
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(item)}>
                            <Eye />
                            View sources
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          {item.status !== "DISMISSED" && (
                            <DropdownMenuItem onClick={() => onDismiss(item)}>
                              <Ban />
                              Dismiss
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </AnimatedTableRow>
              )
            })}
          </AnimatePresence>
        </AnimatedTableBody>
      </Table>
    </div>
  )
}
