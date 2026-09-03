"use client"

import * as React from "react"
import { AlertTriangle, RotateCcw, Save } from "lucide-react"

import { HeygenSection } from "@/components/settings/heygen-section"
import { OpenAiSection } from "@/components/settings/openai-section"
import { ScriptShapeSection } from "@/components/settings/script-shape-section"
import { ThemePreference } from "@/components/settings/theme-preference"
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

  // The server response is the baseline the draft is compared against, so a
  // successful save clears the dirty state without a refetch.
  const [saved, setSaved] = React.useState<AppSettings | null>(null)

  // Seed both from a fetch, tracking the fetched object itself rather than the
  // baseline: a save replaces the baseline, and comparing against that would
  // read as new data and throw the just-saved draft away.
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
      // Only changed fields go up, so two people editing different sections
      // do not overwrite each other's values.
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
          <Card key={index}>
            <CardContent className="space-y-3 py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
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
      <ThemePreference />

      {/* Anchored so the save stays reachable however far down the page the
          edit was made. */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <div
          data-dirty={isDirty}
          className="flex items-center gap-3 rounded-xl border bg-popover/95 px-3 py-2 shadow-lg backdrop-blur-sm transition-opacity data-[dirty=false]:pointer-events-none data-[dirty=false]:opacity-0"
        >
          <span className="text-xs text-muted-foreground">
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
