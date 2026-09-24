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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { createKeyword, updateKeyword } from "@/lib/api/news-config"
import {
  DEFAULT_PRIORITY,
  DEFAULT_SCOPE,
  KEYWORD_SCOPES,
  KEYWORD_TYPES,
  MAX_PRIORITY,
  MIN_PRIORITY,
  QUERY_GUIDE_URL,
  defaultType,
  splitList,
} from "@/lib/constants/news-keywords"
import type { NewsKeyword } from "@/lib/types/news-config"

const AUTO_TYPE = "auto"

const PRIORITIES = Array.from(
  { length: MAX_PRIORITY - MIN_PRIORITY + 1 },
  (_, index) => String(MIN_PRIORITY + index)
)

const BLANK = {
  keywordId: "",
  topicLabel: "",
  query: "",
  terms: "",
  places: "",
  type: AUTO_TYPE,
  scope: DEFAULT_SCOPE,
  priority: String(DEFAULT_PRIORITY),
  active: true,
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono">{children}</code>
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
              priority: String(keyword.priority),
              active: keyword.active,
            }
          : BLANK
      )
    }
  }

  function patch(partial: Partial<typeof BLANK>) {
    setForm((current) => ({ ...current, ...partial }))
  }

  const canSubmit = form.query.trim().length > 0
  const autoType = defaultType(form.query)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || isSaving) return

    setIsSaving(true)
    try {
      const blank = isEditing ? "" : undefined
      const payload = {
        keywordId: form.keywordId.trim() || undefined,
        topicLabel: form.topicLabel.trim() || blank,
        query: form.query.trim(),
        terms: splitList(form.terms),
        places: splitList(form.places),
        type: form.type === AUTO_TYPE ? blank : form.type,
        scope: form.scope,
        priority: Number(form.priority),
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
              One topic per feed. Only the query is required. Put a place in
              every query, and put quotes around anything that belongs
              together.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="kw-query">Query</Label>
            <Textarea
              id="kw-query"
              rows={2}
              value={form.query}
              onChange={(event) => patch({ query: event.target.value })}
              placeholder='"gas tax" OR "fuel tax" California -Texas'
              autoFocus
            />
            <Hint>
              Plain words must all appear (commas are ignored). Use{" "}
              <Code>&quot;quotes&quot;</Code> for an exact phrase,{" "}
              <Code>OR</Code> in capitals for either one, <Code>-word</Code> to
              exclude, <Code>intitle:</Code> for headlines only and{" "}
              <Code>site:</Code> for one outlet. The last 24 hours is searched
              unless you add <Code>when:3d</Code> or <Code>when:12h</Code>.
            </Hint>
            <Hint>
              Or start with <Code>GEO:</Code> for all local news about a place,{" "}
              <Code>RSS:</Code> for an outlet&apos;s own feed, or{" "}
              <Code>X:</Code> for an X search (not read by the morning run).{" "}
              <a
                href={QUERY_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Read the full query guide
              </a>
              .
            </Hint>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="kw-label">Topic label</Label>
              <Input
                id="kw-label"
                value={form.topicLabel}
                onChange={(event) => patch({ topicLabel: event.target.value })}
                placeholder="Gas tax"
              />
              <Hint>Optional. Left empty, the query text is used.</Hint>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kw-id">Code</Label>
              <Input
                id="kw-id"
                value={form.keywordId}
                onChange={(event) => patch({ keywordId: event.target.value })}
                placeholder={isEditing ? "K01" : "Auto"}
              />
              {!isEditing && (
                <Hint>Optional. Left empty, the next free K-number is used.</Hint>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kw-terms">Terms</Label>
            <Input
              id="kw-terms"
              value={form.terms}
              onChange={(event) => patch({ terms: event.target.value })}
              placeholder="gas tax | fuel tax | gas prices"
            />
            <Hint>
              Optional. Separated by <Code>|</Code> or commas. An article must
              mention at least one, or it is discarded.
            </Hint>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kw-places">Places</Label>
            <Input
              id="kw-places"
              value={form.places}
              onChange={(event) => patch({ places: event.target.value })}
              placeholder="Thousand Oaks | Simi Valley"
            />
            <Hint>
              Optional, same format. An article must mention at least one.
              Only worth using when a search keeps returning junk.
            </Hint>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="kw-type">Type</Label>
              <Select
                value={form.type}
                items={[
                  { value: AUTO_TYPE, label: `Auto (${autoType})` },
                  ...KEYWORD_TYPES,
                ]}
                onValueChange={(type) => type && patch({ type })}
              >
                <SelectTrigger id="kw-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO_TYPE}>Auto ({autoType})</SelectItem>
                  {KEYWORD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kw-scope">Scope</Label>
              <Select
                value={form.scope}
                items={KEYWORD_SCOPES}
                onValueChange={(scope) => scope && patch({ scope })}
              >
                <SelectTrigger id="kw-scope" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KEYWORD_SCOPES.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kw-priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(priority) => priority && patch({ priority })}
              >
                <SelectTrigger id="kw-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Hint>
            <Code>name</Code> is for people and ranks higher. A{" "}
            <Code>district</Code> scope gives a ranking boost. A higher priority
            ranks above other stories.
          </Hint>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <Label htmlFor="kw-active">Active</Label>
              <Hint>Inactive feeds are skipped by the morning run.</Hint>
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
