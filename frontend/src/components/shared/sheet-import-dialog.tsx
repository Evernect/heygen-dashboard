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
import type { ParsedRow } from "@/lib/utils/parse-sheet"
import { cn } from "@/lib/utils"

export interface ImportColumn<T> {
  label: string
  render: (row: T) => React.ReactNode
  className?: string
}

function ColumnCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
      {children}
    </code>
  )
}

export function SheetImportDialog<T extends ParsedRow>({
  open,
  onOpenChange,
  title,
  description,
  requiredColumns,
  columns,
  parse,
  submit,
  onImported,
  noun,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  requiredColumns: string[]
  columns: ImportColumn<T>[]
  parse: (file: File) => Promise<T[]>
  submit: (rows: T[]) => Promise<number>
  onImported: () => void
  noun: string
}) {
  const { notifySuccess, notifyError } = useToastFeedback()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const inputId = React.useId()

  const [rows, setRows] = React.useState<T[]>([])
  const [parseError, setParseError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const validRows = rows.filter((row) => !row.error)
  const updateCount = validRows.filter(
    (row) => (row as { isUpdate?: boolean }).isUpdate
  ).length

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
      setRows(await parse(file))
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
      const count = await submit(validRows)
      const skipped = rows.length - validRows.length

      notifySuccess(
        `${title.replace("Import ", "")} imported`.replace(/^./, (c) =>
          c.toUpperCase()
        ),
        [
          `${count} ${noun}${count === 1 ? "" : "s"} imported`,
          updateCount > 0 ? `${updateCount} updated` : null,
          skipped > 0 ? `${skipped} skipped` : null,
        ]
          .filter(Boolean)
          .join(", ") + "."
      )

      handleOpenChange(false)
      onImported()
    } catch (error) {
      notifyError(`Could not import ${noun}s`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="grid gap-3">
            <label
              htmlFor={inputId}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground hover:bg-muted/50"
            >
              <Upload className="size-5" />
              <span>Click to choose a CSV or Excel file</span>
              <span className="flex flex-wrap items-center justify-center gap-1 text-xs">
                Required columns:
                {requiredColumns.map((column) => (
                  <ColumnCode key={column}>{column}</ColumnCode>
                ))}
              </span>
              <input
                ref={fileInputRef}
                id={inputId}
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
            <div className="flex items-center justify-between gap-3 text-sm">
              <p>
                {rows.length} rows found — {validRows.length} valid
                {updateCount > 0 && `, ${updateCount} will update an existing ${noun}`}
                {rows.length - validRows.length > 0 &&
                  `, ${rows.length - validRows.length} skipped`}
                .
              </p>
              <button
                type="button"
                className="shrink-0 text-muted-foreground underline underline-offset-4 hover:text-foreground"
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
                    {columns.map((column) => (
                      <TableHead key={column.label}>{column.label}</TableHead>
                    ))}
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
                      {columns.map((column) => (
                        <TableCell
                          key={column.label}
                          className={cn("max-w-48 truncate", column.className)}
                        >
                          {column.render(row)}
                        </TableCell>
                      ))}
                      <TableCell>
                        {row.error ? (
                          <Badge variant="destructive">{row.error}</Badge>
                        ) : (row as { isUpdate?: boolean }).isUpdate ? (
                          <Badge variant="outline">Update</Badge>
                        ) : (
                          <Badge variant="secondary">New</Badge>
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
          {rows.length > 0 && (
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={validRows.length === 0 || isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin" />}
              Import {validRows.length} {noun}
              {validRows.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
