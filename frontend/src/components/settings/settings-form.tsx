"use client"

import * as React from "react"
import { AlertTriangle, RotateCcw, Save } from "lucide-react"

import { HeygenSection } from "@/components/settings/heygen-section"
import { OpenAiSection } from "@/components/settings/openai-section"
import { ScriptShapeSection } from "@/components/settings/script-shape-section"
import { ErrorState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { getSettings, updateSettings } from "@/lib/api/settings"
import type { AppSettings } from "@/lib/types/settings"

export function SettingsForm() {
  const { data, error, isLoading, refetch } = useAsyncData(
    () => getSettings(),
    []
  )
  const { notifySuccess, notifyError } = useToastFeedback()

  const [draft, setDraft] = React.useState<AppSettings | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [saved, setSaved] = React.useState<AppSettings | null>(null)

  const fetched = data?.settings ?? null
  const [lastFetched, setLastFetched] = React.useState<AppSettings | null>(null)

  if (fetched && fetched !== lastFetched) {
    setLastFetched(fetched)
    setDraft(fetched)
    setSaved(fetched)
  }

  const patch = React.useCallback((partial: Partial<AppSettings>) => {
    setDraft((current) => (current ? { ...current, ...partial } : current))
  }, [])

  const isDirty =
    draft !== null && saved !== null && !shallowEqual(draft, saved)

  const wordsInvalid =
    draft !== null && draft.targetWordsMin > draft.targetWordsMax

  async function handleSave() {
    if (!draft || !saved) return

    setIsSaving(true)
    try {
      const response = await updateSettings(changedFields(draft, saved))
      setDraft(response.settings)
      setSaved(response.settings)
      notifySuccess("Settings saved", "New runs will use these values.")
    } catch (caught) {
      notifyError("Could not save settings", caught)
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset() {
    if (saved) setDraft(saved)
  }

  if (isLoading || (!draft && !error)) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((index) => (
          <Card key={index} className="gap-0">
            <CardContent className="space-y-4 pb-2">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {[0, 1].map((field) => (
                  <div key={field} className="space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !draft) {
    return (
      <ErrorState
        icon={AlertTriangle}
        title="Could not load settings"
        description={error?.message ?? "The settings endpoint returned nothing."}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            <RotateCcw />
            Try again
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <HeygenSection draft={draft} patch={patch} disabled={isSaving} />
      <OpenAiSection draft={draft} patch={patch} disabled={isSaving} />
      <ScriptShapeSection draft={draft} patch={patch} disabled={isSaving} />

      <div className="sticky bottom-4 z-10 flex justify-end">
        <div
          data-dirty={isDirty}
          data-invalid={wordsInvalid}
          className="flex items-center gap-3 rounded-xl border bg-popover/95 px-3 py-2 shadow-lg ring-1 ring-primary/15 backdrop-blur-sm transition-all duration-200 data-[dirty=false]:pointer-events-none data-[dirty=false]:translate-y-2 data-[dirty=false]:opacity-0 data-[invalid=true]:ring-destructive/30"
        >
          <span className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-primary data-[invalid=true]:bg-destructive"
              data-invalid={wordsInvalid}
            />
            {wordsInvalid ? "Fix the word range to save" : "Unsaved changes"}
          </span>
          <Button variant="ghost" onClick={handleReset} disabled={isSaving}>
            Discard
          </Button>
          <Button onClick={handleSave} disabled={isSaving || wordsInvalid}>
            <Save />
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function shallowEqual(a: AppSettings, b: AppSettings) {
  return (Object.keys(a) as (keyof AppSettings)[]).every(
    (key) => a[key] === b[key]
  )
}

function changedFields(draft: AppSettings, saved: AppSettings) {
  const patch: Partial<AppSettings> = {}

  for (const key of Object.keys(draft) as (keyof AppSettings)[]) {
    if (key === "id") continue
    if (draft[key] !== saved[key]) {
      Object.assign(patch, { [key]: draft[key] })
    }
  }

  return patch
}
