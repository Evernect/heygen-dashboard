"use client"

import * as React from "react"
import { Loader2, MessageSquareQuote, Plus, Trash2 } from "lucide-react"

import { SettingsSection } from "@/components/settings/settings-section"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  createStylePlaybookEntry,
  deleteStylePlaybookEntry,
  listStylePlaybook,
} from "@/lib/api/news-config"
import { formatRelative } from "@/lib/format"
import type { StylePlaybookEntry } from "@/lib/types/news-config"

export function StylePlaybookPanel() {
  const { notifySuccess, notifyError } = useToastFeedback()
  const { data, isLoading, refetch } = useAsyncData(
    () => listStylePlaybook(),
    []
  )

  const [label, setLabel] = React.useState("")
  const [guidance, setGuidance] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<StylePlaybookEntry | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const entries = data?.entries ?? []
  const canAdd = guidance.trim().length > 0

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault()
    if (!canAdd || isAdding) return

    setIsAdding(true)
    try {
      await createStylePlaybookEntry({
        guidance: guidance.trim(),
        label: label.trim() || null,
      })

      setLabel("")
      setGuidance("")
      notifySuccess("Guidance saved", "It supersedes the previous version.")
      await refetch()
    } catch (caught) {
      notifyError("Could not save this guidance", caught)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete() {
    if (!toDelete) return

    setIsDeleting(true)
    try {
      await deleteStylePlaybookEntry(toDelete.id)
      notifySuccess("Guidance removed")
      await refetch()
    } catch (caught) {
      notifyError("Could not remove this guidance", caught)
    } finally {
      setToDelete(null)
      setIsDeleting(false)
    }
  }

  return (
    <SettingsSection
      icon={MessageSquareQuote}
      title="Voice guidance"
      description="Notes on what has been working, handed to the angle writer verbatim. Adding a new version supersedes the last one; the older ones are kept so you can see what changed."
    >
      <div className="space-y-4">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline size-4 animate-spin" />
            Loading guidance…
          </p>
        ) : entries.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            No guidance yet. The angle writer will work from the stated
            positions and the content bank alone.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-3 p-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {entry.isActive && (
                      <Badge className="ring-1 ring-inset bg-status-approved/12 text-status-approved-foreground dark:text-status-approved ring-status-approved/25">
                        In use
                      </Badge>
                    )}
                    {entry.label && (
                      <span className="text-sm font-medium">{entry.label}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(entry.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {entry.guidance}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove guidance"
                  onClick={() => setToDelete(entry)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="grid gap-3 rounded-lg border p-3">
          <div className="grid gap-2">
            <Label htmlFor="playbook-label">Label (optional)</Label>
            <Input
              id="playbook-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="September review"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="playbook-guidance">Guidance</Label>
            <Textarea
              id="playbook-guidance"
              rows={4}
              value={guidance}
              onChange={(event) => setGuidance(event.target.value)}
              placeholder="Shorter openers are outperforming. Lead with the cost to the viewer before naming the policy."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={!canAdd || isAdding}>
              {isAdding ? <Loader2 className="animate-spin" /> : <Plus />}
              Save new version
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Remove this guidance?"
        description="It will no longer be part of the version history."
        confirmLabel="Remove"
        destructive
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </SettingsSection>
  )
}
