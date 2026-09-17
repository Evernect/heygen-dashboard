"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { createKeyword, updateKeyword } from "@/lib/api/news-config"
import type { NewsKeyword } from "@/lib/types/news-config"

const BLANK = {
  keywordId: "",
  topicLabel: "",
  query: "",
  terms: "",
  places: "",
  type: "issue",
  scope: "state",
  priority: 3,
  active: true,
}

function toList(value: string) {
  return value
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function KeywordFormDialog({
  open,
  onOpenChange,
  keyword,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyword?: NewsKeyword | null
  onSaved: () => void
}) {
  const isEditing = Boolean(keyword)
  const { notifySuccess, notifyError } = useToastFeedback()

  const [form, setForm] = React.useState(BLANK)
  const [isSaving, setIsSaving] = React.useState(false)

  const seedKey = open ? (keyword?.id ?? "new") : null
  const [lastSeedKey, setLastSeedKey] = React.useState(seedKey)
  if (seedKey !== lastSeedKey) {
    setLastSeedKey(seedKey)
    if (seedKey !== null) {
      setForm(
        keyword
          ? {
              keywordId: keyword.keywordId,
              topicLabel: keyword.topicLabel,
              query: keyword.query,
              terms: keyword.terms.join(" | "),
              places: keyword.places.join(" | "),
              type: keyword.type,
              scope: keyword.scope,
              priority: keyword.priority,
              active: keyword.active,
            }
          : BLANK
      )
    }
  }

  function patch(partial: Partial<typeof BLANK>) {
    setForm((current) => ({ ...current, ...partial }))
  }

  const canSubmit =
    form.keywordId.trim().length > 0 &&
    form.topicLabel.trim().length > 0 &&
    form.query.trim().length > 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || isSaving) return

    setIsSaving(true)
    try {
      const payload = {
        keywordId: form.keywordId.trim(),
        topicLabel: form.topicLabel.trim(),
        query: form.query.trim(),
        terms: toList(form.terms),
        places: toList(form.places),
        type: form.type.trim() || "issue",
        scope: form.scope.trim() || "state",
        priority: Number(form.priority) || 3,
        active: form.active,
      }

      if (keyword) {
        await updateKeyword(keyword.id, payload)
        notifySuccess("Feed updated")
      } else {
        await createKeyword(payload)
        notifySuccess("Feed added")
      }

      onOpenChange(false)
      onSaved()
    } catch (caught) {
      notifyError(isEditing ? "Could not update feed" : "Could not add feed", caught)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit feed" : "New feed"}</DialogTitle>
            <DialogDescription>
              One feed per row. The terms and places are what actually decide
              relevance — Google News ignores the boolean operators in a query,
              so the query alone constrains almost nothing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="kw-id">Code</Label>
              <Input
                id="kw-id"
                value={form.keywordId}
                onChange={(event) => patch({ keywordId: event.target.value })}
                placeholder="K01"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kw-label">Topic label</Label>
              <Input
                id="kw-label"
                value={form.topicLabel}
                onChange={(event) => patch({ topicLabel: event.target.value })}
                placeholder="Gas tax"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kw-query">Query</Label>
            <Textarea
              id="kw-query"
              rows={2}
              value={form.query}
              onChange={(event) => patch({ query: event.target.value })}
              placeholder='(gas tax OR "fuel tax") California when:1d'
            />
            <p className="text-xs text-muted-foreground">
              Prefix with <code className="font-mono">RSS:</code> for a
              publisher&apos;s own feed, or <code className="font-mono">GEO:</code>{" "}
              for a place feed. Anything else is a Google News search.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kw-terms">Terms</Label>
            <Input
              id="kw-terms"
              value={form.terms}
              onChange={(event) => patch({ terms: event.target.value })}
              placeholder="gas tax | fuel tax | gas prices"
            />
            <p className="text-xs text-muted-foreground">
              Separated by <code className="font-mono">|</code>. An article must
              mention at least one. Leave empty to accept anything.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kw-places">Places</Label>
            <Input
              id="kw-places"
              value={form.places}
              onChange={(event) => patch({ places: event.target.value })}
              placeholder="California | Sacramento | Newsom"
            />
            <p className="text-xs text-muted-foreground">
              Also required, and also <code className="font-mono">|</code>{" "}
              separated. Both a term and a place must match.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="kw-type">Type</Label>
              <Input
                id="kw-type"
                value={form.type}
                onChange={(event) => patch({ type: event.target.value })}
                placeholder="issue"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kw-scope">Scope</Label>
              <Input
                id="kw-scope"
                value={form.scope}
                onChange={(event) => patch({ scope: event.target.value })}
                placeholder="state"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kw-priority">Priority</Label>
              <Input
                id="kw-priority"
                type="number"
                min={1}
                max={10}
                value={form.priority}
                onChange={(event) =>
                  patch({ priority: Number(event.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <Label htmlFor="kw-active">Active</Label>
              <p className="text-xs text-muted-foreground">
                Inactive feeds are skipped by the morning run.
              </p>
            </div>
            <Switch
              id="kw-active"
              checked={form.active}
              onCheckedChange={(checked) => patch({ active: checked })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              {isEditing ? "Save changes" : "Add feed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
