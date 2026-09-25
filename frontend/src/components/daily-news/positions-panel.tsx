"use client"

import * as React from "react"
import { Plus, Scale, Trash2, TriangleAlert, Upload } from "lucide-react"

import { PositionFormDialog } from "@/components/daily-news/position-form-dialog"
import { SettingsSection } from "@/components/settings/settings-section"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ErrorState } from "@/components/shared/empty-state"
import { ListPagination } from "@/components/shared/list-pagination"
import { LoadingState, RetryButton } from "@/components/shared/loading-state"
import { SheetImportDialog } from "@/components/shared/sheet-import-dialog"
import { Button } from "@/components/ui/button"
import { useAsyncData } from "@/hooks/use-async-data"
import { usePagination } from "@/hooks/use-pagination"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  bulkUpsertPositions,
  deletePosition,
  listPositions,
} from "@/lib/api/news-config"
import {
  parsePositionsFile,
  positionPayload,
  type ParsedPositionRow,
} from "@/lib/utils/parse-news-files"
import type { CandidatePosition } from "@/lib/types/news-config"

const PAGE_SIZE = 8

export function PositionsPanel() {
  const { notifySuccess, notifyError } = useToastFeedback()
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    () => listPositions(),
    []
  )

  const [formOpen, setFormOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<CandidatePosition | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const positions = data?.positions ?? []
  const { page, setPage, totalPages, pageItems } = usePagination(
    positions,
    PAGE_SIZE
  )

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
      <div className="space-y-3">
        {isLoading ? (
          <LoadingState label="Loading positions…" className="py-8" />
        ) : error ? (
          <ErrorState
            icon={TriangleAlert}
            title="Could not load positions"
            description={error.message}
            className="py-8"
            action={<RetryButton onRetry={refetch} isRetrying={isRefreshing} />}
          />
        ) : positions.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No positions recorded. Without them every angle comes back flagged
            as uncovered.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {pageItems.map((position) => (
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

        <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload />
            Import
          </Button>
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Plus />
            Add position
          </Button>
        </div>
      </div>

      <PositionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        sortOrder={positions.length}
        onSaved={() => void refetch()}
      />

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
