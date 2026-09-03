"use client"

import { AlertTriangle, Type } from "lucide-react"

import { SettingField } from "@/components/settings/setting-field"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AppSettings } from "@/lib/types/settings"

// The prompt writes to a runtime target rather than a fixed 30 seconds, using
// the same ~150 words-per-minute the backend assumes.
const WORDS_PER_MINUTE = 150

function estimateSeconds(words: number) {
  return Math.max(10, Math.round((words / WORDS_PER_MINUTE) * 60))
}

export function ScriptShapeSection({
  draft,
  patch,
  disabled,
}: {
  draft: AppSettings
  patch: (patch: Partial<AppSettings>) => void
  disabled?: boolean
}) {
  const invalid = draft.targetWordsMin > draft.targetWordsMax

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="size-4" />
          Script length
        </CardTitle>
        <CardDescription>
          The spoken word count the model writes to. SSML pause tags and the
          closing line are excluded from the count.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField label="Minimum words" htmlFor="words-min">
            <Input
              id="words-min"
              type="number"
              min={10}
              max={400}
              value={draft.targetWordsMin}
              disabled={disabled}
              aria-invalid={invalid}
              onChange={(event) =>
                patch({ targetWordsMin: Number(event.target.value) })
              }
            />
          </SettingField>

          <SettingField label="Maximum words" htmlFor="words-max">
            <Input
              id="words-max"
              type="number"
              min={10}
              max={400}
              value={draft.targetWordsMax}
              disabled={disabled}
              aria-invalid={invalid}
              onChange={(event) =>
                patch({ targetWordsMax: Number(event.target.value) })
              }
            />
          </SettingField>
        </div>

        {invalid ? (
          <p className="flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            The minimum must be less than or equal to the maximum.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            About {estimateSeconds(draft.targetWordsMin)}-
            {estimateSeconds(draft.targetWordsMax)} seconds of speech at{" "}
            {WORDS_PER_MINUTE} words per minute.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
