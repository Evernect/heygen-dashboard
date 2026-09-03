"use client"

import * as React from "react"
import { Loader2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { bulkCreateTopics } from "@/lib/api/topics"
import { parseTopicsFile, type ParsedTopicRow } from "@/lib/utils/parse-topics-file"
import { cn } from "@/lib/utils"

export function BulkImportTopicsDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}) {
  const { notifySuccess, notifyError } = useToastFeedback()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [rows, setRows] = React.useState<ParsedTopicRow[]>([])
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const stage = rows.length > 0 ? "preview" : "idle"
  const validRows = rows.filter((row) => !row.error)

  function reset() {
    setRows([])
    setParseError(null)
    setIsSubmitting(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setParseError(null)
    try {
      const parsed = await parseTopicsFile(file)
      setRows(parsed)
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Could not read this file."
      )
    }
  }

  async function handleSubmit() {
    if (validRows.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    try {
      const { created } = await bulkCreateTopics(
        validRows.map((row) => ({ issue: row.issue, angle: row.angle }))
      )
      const skipped = rows.length - validRows.length
      notifySuccess(
        "Topics imported",
        skipped > 0
          ? `${created.length} topics imported, ${skipped} skipped.`
          : `${created.length} topics imported.`
      )
      handleOpenChange(false)
      onImported()
    } catch (error) {
      notifyError("Could not import topics", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import topics</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
              issue
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
              angle
            </code>{" "}
            columns as the header row.
          </DialogDescription>
        </DialogHeader>

        {stage === "idle" ? (
          <div className="grid gap-3">
            <label
              htmlFor="topics-file-input"
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground hover:bg-muted/50"
              )}
            >
              <Upload className="size-5" />
              <span>Click to choose a CSV or Excel file</span>
              <span className="text-xs">
                Required columns:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
                  issue
                </code>
                ,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">
                  angle
                </code>
              </span>
              <input
                ref={fileInputRef}
                id="topics-file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(event) => void handleFileChange(event)}
              />
            </label>
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <p>
                {rows.length} rows found — {validRows.length} valid,{" "}
                {rows.length - validRows.length} skipped.
              </p>
              <button
                type="button"
                className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                onClick={reset}
              >
                Choose a different file
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Angle</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.rowNumber}
                      className={cn(row.error && "bg-destructive/5")}
                    >
                      <TableCell className="text-muted-foreground">
                        {row.rowNumber}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {row.issue}
                      </TableCell>
                      <TableCell className="max-w-64 truncate">
                        {row.angle}
                      </TableCell>
                      <TableCell>
                        {row.error ? (
                          <Badge variant="destructive">{row.error}</Badge>
                        ) : (
                          <Badge variant="secondary">Valid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {stage === "preview" && (
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={validRows.length === 0 || isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Import {validRows.length} topic{validRows.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
