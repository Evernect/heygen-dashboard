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
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Issue</TableHead>
              <TableHead className="min-w-64">Angle</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 text-right">Used</TableHead>
              <TableHead className="w-36">Last used</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
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
                    className="border-b transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">
                      {topic.issue}
                      {topic.status === "ERROR" && topic.generateError && (
                        <p className="mt-1 text-xs font-normal text-destructive">
                          {topic.generateError}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      <span className="line-clamp-2">{topic.angle}</span>
                    </TableCell>

                    <TableCell>
                      <TopicStatusBadge status={topic.status} />
                    </TableCell>

                    <TableCell className="text-right">
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

                    <TableCell className="text-muted-foreground">
                      {topic.lastUsedAt ? formatRelative(topic.lastUsedAt) : "—"}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
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
    </div>
  )
}
