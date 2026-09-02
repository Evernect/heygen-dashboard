"use client"

import * as React from "react"
import { AnimatePresence } from "framer-motion"
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react"

import {
  AnimatedTableBody,
  AnimatedTableRow,
} from "@/components/motion/animated-list"
import { TopicStatusBadge } from "@/components/shared/status-badge"
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
import { formatRelative } from "@/lib/format"
import type { Topic } from "@/lib/types/topic"
import { cn } from "@/lib/utils"

/**
 * One layout rule for the whole grid: every cell gets the same horizontal
 * padding and the same centred alignment, and the outer two align with the
 * card edge. Applied to the header row and to each body row so the two can't
 * drift out of step. Individual cells opt out of the centring with `text-*!`.
 */
const ROW_LAYOUT =
  "[&>*]:px-3 [&>*]:text-center [&>*:first-child]:pl-4 [&>*:last-child]:pr-4"

export function TopicsTable({
  topics,
  generatingId,
  onGenerate,
  onEdit,
  onDelete,
}: {
  topics: Topic[]
  generatingId: string | null
  onGenerate: (topic: Topic) => void
  onEdit: (topic: Topic) => void
  onDelete: (topic: Topic) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table className="min-w-[700px] table-fixed">
        <colgroup>
          <col className="w-[21%]" />
          <col className="w-[21%]" />
          <col className="w-[12%]" />
          <col className="w-[7%]" />
          <col className="w-[20%]" />
          <col className="w-[19%]" />
        </colgroup>

        <TableHeader>
          <TableRow className={cn(ROW_LAYOUT, "[&>th]:h-11")}>
            <TableHead>Issue</TableHead>
            <TableHead>Angle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Used</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <AnimatedTableBody>
          <AnimatePresence initial={false}>
            {topics.map((topic) => {
              const isGenerating =
                generatingId === topic.id || topic.status === "GENERATING"

              return (
                <AnimatedTableRow
                  key={topic.id}
                  layout
                  className={cn(
                    ROW_LAYOUT,
                    "border-b transition-colors hover:bg-muted/40 [&>td]:py-3"
                  )}
                >
                  {/* Issue and angle are the two columns read as prose, so they
                      keep a left ragged-right edge rather than centring. */}
                  <TableCell className="whitespace-normal text-left! font-medium">
                    <span className="line-clamp-2">{topic.issue}</span>
                    {topic.status === "ERROR" && topic.generateError && (
                      <p className="mt-1 text-xs font-normal text-destructive">
                        {topic.generateError}
                      </p>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-normal text-left! text-muted-foreground">
                    <span className="line-clamp-2">{topic.angle}</span>
                  </TableCell>

                  <TableCell>
                    <TopicStatusBadge status={topic.status} />
                  </TableCell>

                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="cursor-default tabular-nums" />
                        }
                      >
                        {topic.timesUsed}
                      </TooltipTrigger>
                      <TooltipContent>
                        How many scripts have been generated from this topic
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell className="truncate text-muted-foreground">
                    {topic.lastUsedAt ? formatRelative(topic.lastUsedAt) : "—"}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onGenerate(topic)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Sparkles />
                        )}
                        {isGenerating ? "Generating" : "Generate"}
                      </Button>

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
                          <DropdownMenuItem onClick={() => onEdit(topic)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onDelete(topic)}
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
