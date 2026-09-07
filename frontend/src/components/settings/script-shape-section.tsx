"use client"

import { AlertTriangle, Type } from "lucide-react"

import { SettingField } from "@/components/settings/setting-field"
import {
  SettingsGrid,
  SettingsSection,
} from "@/components/settings/settings-section"
import { Input } from "@/components/ui/input"
import type { AppSettings } from "@/lib/types/settings"

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
    <SettingsSection
      icon={Type}
      title="Script length"
      description="The spoken word count the model writes to. SSML pause tags and the closing line are excluded from the count."
    >
      <SettingsGrid>
        <SettingField
          className="lg:col-span-2"
          label="Minimum words"
          htmlFor="words-min"
        >
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

        <SettingField
          className="lg:col-span-2"
          label="Maximum words"
          htmlFor="words-max"
        >
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

        <SettingField
          className="sm:col-span-2 lg:col-span-2"
          label="Estimated runtime"
          description={
            invalid
              ? undefined
              : `At ${WORDS_PER_MINUTE} words per minute of speech.`
          }
        >
          {invalid ? (
            <p className="flex min-h-9 items-center gap-2 rounded-lg bg-destructive/10 px-3 text-xs text-destructive">
              <AlertTriangle className="size-3.5 shrink-0" />
              Minimum must be at or below the maximum.
            </p>
          ) : (
            <p className="flex min-h-9 items-center rounded-lg bg-muted/60 px-3 font-mono text-sm tabular-nums">
              {estimateSeconds(draft.targetWordsMin)}–
              {estimateSeconds(draft.targetWordsMax)}s
            </p>
          )}
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  )
}
