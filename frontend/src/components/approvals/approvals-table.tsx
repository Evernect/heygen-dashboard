"use client"

import { AnimatePresence } from "framer-motion"
import { Eye, MoreHorizontal, RotateCcw, ThumbsDown } from "lucide-react"

import {
  AnimatedTableBody,
  AnimatedTableRow,
} from "@/components/motion/animated-list"
import { PlatformBadgeList } from "@/components/shared/platform-badges"
import { ScriptStatusBadge } from "@/components/shared/status-badge"
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime } from "@/lib/format"
import type { Script } from "@/lib/types/script"

export function ApprovalsTable({
  scripts,
  onOpen,
  onReject,
  onRetry,
}: {
  scripts: Script[]
  onOpen: (script: Script) => void
  onReject: (script: Script) => void
  onRetry: (script: Script) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Title</TableHead>
              <TableHead className="min-w-48">Issue</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead className="min-w-44">Platforms</TableHead>
              <TableHead className="w-44">Scheduled</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <AnimatedTableBody>
            <AnimatePresence initial={false}>
              {scripts.map((script) => (
                <AnimatedTableRow
                  key={script.id}
                  layout
                  onClick={() => onOpen(script)}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/40"
                >
                  <TableCell className="font-medium">{script.title}</TableCell>

                  <TableCell className="text-muted-foreground">
                    <span className="line-clamp-1">
                      {script.topic?.issue ?? "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <ScriptStatusBadge status={script.status} />
                  </TableCell>

                  <TableCell>
                    <PlatformBadgeList platforms={script.targetPlatforms} />
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {script.scheduledAt ? formatDateTime(script.scheduledAt) : "—"}
                  </TableCell>

                  <TableCell>
                    {/* Stops the row's open-detail handler firing twice. */}
                    <div
                      className="flex justify-end"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Row actions"
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onOpen(script)}>
                            <Eye />
                            View details
                          </DropdownMenuItem>

                          {script.status === "FAILED" && (
                            <DropdownMenuItem onClick={() => onRetry(script)}>
                              <RotateCcw />
                              Retry publishing
                            </DropdownMenuItem>
                          )}

                          {!["PROCESSING", "POSTED", "REJECTED"].includes(
                            script.status
                          ) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onReject(script)}
                              >
                                <ThumbsDown />
                                Disapprove
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </AnimatedTableRow>
              ))}
            </AnimatePresence>
          </AnimatedTableBody>
        </Table>
      </div>
    </div>
  )
}
