"use client"

import * as React from "react"
import { Loader2, Plus, Scale, Trash2, Upload } from "lucide-react"

import { SettingsSection } from "@/components/settings/settings-section"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SheetImportDialog } from "@/components/shared/sheet-import-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  bulkUpsertPositions,
  createPosition,
  deletePosition,
  listPositions,
} from "@/lib/api/news-config"
import {
  parsePositionsFile,
  positionPayload,
  type ParsedPositionRow,
} from "@/lib/utils/parse-news-files"
import type { CandidatePosition } from "@/lib/types/news-config"

export function PositionsPanel() {
  const { notifySuccess, notifyError } = useToastFeedback()
  const { data, isLoading, refetch } = useAsyncData(() => listPositions(), [])

  const [issue, setIssue] = React.useState("")
  const [stance, setStance] = React.useState("")
  const [sourceUrl, setSourceUrl] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<CandidatePosition | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const positions = data?.positions ?? []
  const canAdd = issue.trim().length > 0 && stance.trim().length > 0

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!canAdd || isAdding) return

    setIsAdding(true)
    try {
      await createPosition({
        issue: issue.trim(),
        stance: stance.trim(),
        sourceUrl: sourceUrl.trim() || null,
        sortOrder: positions.length,
      })

      setIssue("")
      setStance("")
      setSourceUrl("")
      notifySuccess("Position added")
      await refetch()
    } catch (caught) {
      notifyError("Could not add this position", caught)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return

    setIsDeleting(true)
    try {
      await deletePosition(toDelete.id)
      notifySuccess("Position removed")
      await refetch()
    } catch (caught) {
      notifyError("Could not remove this position", caught)
    } finally {
      setToDelete(null)
      setIsDeleting(false)
    }
  }

  return (
    <SettingsSection
      icon={Scale}
      title="Stated positions"
      description="What the candidate has already said. The selector prefers stories that touch one of these, and the angle writer is told never to contradict them — an angle with no matching position comes back flagged rather than invented."
    >
      <div className="space-y-4">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline size-4 animate-spin" />
            Loading positions…
          </p>
        ) : positions.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No positions recorded. Without them every angle comes back flagged
            as uncovered.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {positions.map((position) => (
              <li
                key={position.id}
                className="flex items-start justify-between gap-3 p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">{position.issue}</p>
                  <p className="text-sm text-muted-foreground">
                    {position.stance}
                  </p>
                  {position.sourceUrl && (
                    <a
                      href={position.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block break-all text-xs text-primary hover:underline"
                    >
                      {position.sourceUrl}
                    </a>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove position"
                  onClick={() => setToDelete(position)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="grid gap-3 rounded-lg border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="position-issue">Issue</Label>
              <Input
                id="position-issue"
                value={issue}
                onChange={(event) => setIssue(event.target.value)}
                placeholder="Gas tax"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position-source">Source (optional)</Label>
              <Input
                id="position-source"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://example.com/positions"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position-stance">Position</Label>
            <Textarea
              id="position-stance"
              rows={2}
              value={stance}
              onChange={(event) => setStance(event.target.value)}
              placeholder="Opposes gas tax increases and the proposed mileage tax; wants to cut the state gas tax."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(true)}
            >
              <Upload />
              Import
            </Button>
            <Button type="submit" variant="outline" disabled={!canAdd || isAdding}>
              {isAdding ? <Loader2 className="animate-spin" /> : <Plus />}
              Add position
            </Button>
          </div>
        </form>
      </div>

      <SheetImportDialog<ParsedPositionRow>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import positions"
        noun="position"
        description={
          <>
            Upload the Positions sheet straight from Google Sheets. Rows are
            matched on the issue, so a corrected sheet updates the stance in
            place rather than leaving two contradictory positions.
          </>
        }
        requiredColumns={["topic_label", "position_summary"]}
        columns={[
          { label: "Issue", render: (row) => row.issue, className: "w-40" },
          { label: "Position", render: (row) => row.stance, className: "max-w-80" },
          {
            label: "Source",
            render: (row) => row.sourceUrl ?? "—",
            className: "w-40 text-xs text-muted-foreground",
          },
        ]}
        parse={(file) =>
          parsePositionsFile(
            file,
            positions.map((position) => position.issue)
          )
        }
        submit={async (rows) => {
          const { count } = await bulkUpsertPositions(rows.map(positionPayload))
          return count
        }}
        onImported={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove this position?"
        description={
          <>
            <span className="font-medium text-foreground">
              {toDelete?.issue}
            </span>{" "}
            will no longer be shown to the selector or the angle writer.
          </>
        }
        confirmLabel="Remove"
        destructive
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </SettingsSection>
  )
}
