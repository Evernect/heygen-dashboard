"use client"

import * as React from "react"
import { Loader2, Pencil, Plus, Radio, Trash2, Upload } from "lucide-react"

import { KeywordFormDialog } from "@/components/daily-news/keyword-form-dialog"
import { SettingsSection } from "@/components/settings/settings-section"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { SheetImportDialog } from "@/components/shared/sheet-import-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  bulkUpsertKeywords,
  deleteKeyword,
  listKeywords,
  updateKeyword,
} from "@/lib/api/news-config"
import {
  keywordPayload,
  parseKeywordsFile,
  type ParsedKeywordRow,
} from "@/lib/utils/parse-news-files"
import type { NewsKeyword } from "@/lib/types/news-config"

function feedKind(query: string) {
  if (query.startsWith("RSS:")) return "Publisher feed"
  if (query.startsWith("GEO:")) return "Place feed"
  return "News search"
}

export function KeywordsPanel() {
  const { notifySuccess, notifyError } = useToastFeedback()
  const { data, isLoading, refetch } = useAsyncData(() => listKeywords(), [])

  const [formOpen, setFormOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<NewsKeyword | null>(null)
  const [toDelete, setToDelete] = React.useState<NewsKeyword | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  const keywords = data?.keywords ?? []
  const activeCount = keywords.filter((keyword) => keyword.active).length

  async function handleToggle(keyword: NewsKeyword, active: boolean) {
    setTogglingId(keyword.id)
    try {
      await updateKeyword(keyword.id, { active })
      await refetch()
    } catch (caught) {
      notifyError("Could not update this feed", caught)
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!toDelete) return

    setIsDeleting(true)
    try {
      await deleteKeyword(toDelete.id)
      notifySuccess("Feed removed")
      await refetch()
    } catch (caught) {
      notifyError("Could not remove this feed", caught)
    } finally {
      setToDelete(null)
      setIsDeleting(false)
    }
  }

  return (
    <SettingsSection
      icon={Radio}
      title="Feeds"
      description={
        isLoading
          ? "Where the morning run looks for stories."
          : `Where the morning run looks for stories. ${activeCount} active of ${keywords.length}.`
      }
    >
      <div className="space-y-3">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline size-4 animate-spin" />
            Loading feeds…
          </p>
        ) : keywords.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No feeds yet. Without at least one, the morning run has nothing to
            read.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {keywords.map((keyword) => (
              <li
                key={keyword.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {keyword.keywordId}
                    </span>
                    <span className="text-sm font-medium">
                      {keyword.topicLabel}
                    </span>
                    <Badge className="ring-1 ring-inset bg-muted text-muted-foreground ring-border">
                      {feedKind(keyword.query)}
                    </Badge>
                    {keyword.scope === "district" && (
                      <Badge className="ring-1 ring-inset bg-primary/10 text-primary ring-primary/20">
                        local
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      priority {keyword.priority}
                    </span>
                  </div>

                  <p className="break-words font-mono text-xs text-muted-foreground">
                    {keyword.query}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {keyword.terms.length ? (
                      <>terms: {keyword.terms.join(", ")}</>
                    ) : (
                      <span className="italic">no term filter</span>
                    )}
                    {" · "}
                    {keyword.places.length ? (
                      <>places: {keyword.places.join(", ")}</>
                    ) : (
                      <span className="italic">no place filter</span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Switch
                    checked={keyword.active}
                    disabled={togglingId === keyword.id}
                    aria-label={`${keyword.active ? "Disable" : "Enable"} ${keyword.topicLabel}`}
                    onCheckedChange={(checked) =>
                      void handleToggle(keyword, checked)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit feed"
                    onClick={() => {
                      setEditing(keyword)
                      setFormOpen(true)
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove feed"
                    onClick={() => setToDelete(keyword)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus />
            Add feed
          </Button>
        </div>
      </div>

      <KeywordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        keyword={editing}
        onSaved={() => void refetch()}
      />

      <SheetImportDialog<ParsedKeywordRow>
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import feeds"
        noun="feed"
        description={
          <>
            Upload the Keywords sheet straight from Google Sheets. Rows are
            matched on their code, so re-importing an edited sheet updates the
            feeds already here rather than duplicating them.
          </>
        }
        requiredColumns={["keyword_id", "topic_label", "query"]}
        columns={[
          { label: "Code", render: (row) => row.keywordId, className: "w-20" },
          { label: "Topic", render: (row) => row.topicLabel },
          {
            label: "Query",
            render: (row) => (
              <span className="font-mono text-xs">{row.query}</span>
            ),
          },
          {
            label: "Filters",
            render: (row) =>
              `${row.terms?.length ?? 0} terms / ${row.places?.length ?? 0} places`,
            className: "w-32 text-xs text-muted-foreground",
          },
        ]}
        parse={(file) =>
          parseKeywordsFile(
            file,
            keywords.map((keyword) => keyword.keywordId)
          )
        }
        submit={async (rows) => {
          const { count } = await bulkUpsertKeywords(rows.map(keywordPayload))
          return count
        }}
        onImported={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove this feed?"
        description={
          <>
            <span className="font-medium text-foreground">
              {toDelete?.topicLabel}
            </span>{" "}
            will no longer be read by the morning run.
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
