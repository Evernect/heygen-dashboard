"use client"

import { AnimatePresence } from "framer-motion"
import {
  Clapperboard,
  Eye,
  Film,
  MoreHorizontal,
  RotateCcw,
  ThumbsDown,
} from "lucide-react"

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
  onRender,
}: {
  scripts: Script[]
  onOpen: (script: Script) => void
  onReject: (script: Script) => void
  onRetry: (script: Script) => void
  onRender: (script: Script) => void
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56 text-center">Title</TableHead>
              <TableHead className="min-w-48 text-center">Issue</TableHead>
              <TableHead className="w-36 text-center">Status</TableHead>
              <TableHead className="w-20 text-center">Video</TableHead>
              <TableHead className="min-w-44 text-center">Platforms</TableHead>
              <TableHead className="w-44 text-center">Uploads at</TableHead>
              <TableHead className="w-20 text-center">Actions</TableHead>
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
                  <TableCell className="text-center font-medium">
                    {script.title}
                  </TableCell>

                  <TableCell className="text-center text-muted-foreground">
                    <span className="line-clamp-1">
                      {script.topic?.issue ?? "—"}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    <ScriptStatusBadge status={script.status} />
                  </TableCell>

                  <TableCell className="text-center">
                    {script.videoStorageUrl ? (
                      <Film className="mx-auto size-4 text-status-approved" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    <PlatformBadgeList
                      platforms={script.targetPlatforms}
                      className="justify-center"
                      max={5}
                      short
                    />
                  </TableCell>

                  <TableCell className="text-center text-muted-foreground">
                    {script.scheduledAt ? formatDateTime(script.scheduledAt) : "—"}
                  </TableCell>

                  <TableCell>
                    <div
                      className="flex justify-center"
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

                          {script.status === "DRAFT" && (
                            <DropdownMenuItem onClick={() => onRender(script)}>
                              <Clapperboard />
                              Use this &amp; generate video
                            </DropdownMenuItem>
                          )}

                          {script.status === "FAILED" && (
                            <DropdownMenuItem onClick={() => onRetry(script)}>
                              <RotateCcw />
                              {script.videoStorageUrl
                                ? "Retry publishing"
                                : "Retry the video"}
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
