"use client"

import * as React from "react"
import { AlertTriangle, Clapperboard, Mic } from "lucide-react"

import { SettingField, SliderField } from "@/components/settings/setting-field"
import {
  SettingsGrid,
  SettingsSection,
} from "@/components/settings/settings-section"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAsyncData } from "@/hooks/use-async-data"
import { listAvatarLooks, listVoices } from "@/lib/api/settings"
import {
  ENGINE_HINTS,
  ENGINE_LABELS,
  HEYGEN_ENGINES,
  type AppSettings,
  type HeygenEngine,
} from "@/lib/types/settings"

type Patch = (patch: Partial<AppSettings>) => void

export function HeygenSection({
  draft,
  patch,
  disabled,
}: {
  draft: AppSettings
  patch: Patch
  disabled?: boolean
}) {
  const looks = useAsyncData(() => listAvatarLooks({ limit: 50 }), [])

  const voices = useAsyncData(() => listVoices({ limit: 100 }), [])

  const selectedLook = looks.data?.items.find(
    (look) => look.id === draft.heygenAvatarLookId
  )
  const selectedVoice = voices.data?.items.find(
    (voice) => voice.id === draft.heygenVoiceId
  )

  const allowedEngines: HeygenEngine[] =
    selectedLook && selectedLook.supportedEngines.length > 0
      ? selectedLook.supportedEngines
      : [...HEYGEN_ENGINES]

  const engineUnsupported =
    selectedLook !== undefined &&
    selectedLook.supportedEngines.length > 0 &&
    !selectedLook.supportedEngines.includes(draft.heygenAvatarEngine)

  const catalogError = looks.error ?? voices.error

  return (
    <SettingsSection
      icon={Clapperboard}
      title="HeyGen render"
      description="Which avatar speaks the script, in which voice, on which rendering engine."
    >
      <SettingsGrid>
        {catalogError && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive sm:col-span-2 lg:col-span-6">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Could not reach HeyGen ({catalogError.message}). The IDs below can
              still be typed in by hand and saved.
            </span>
          </p>
        )}

        <SettingField
          className="lg:col-span-3"
          label="Avatar ID"
          htmlFor="heygen-avatar-look"
          description="The character, outfit and pose. This is the id HeyGen renders with."
        >
          {looks.data && looks.data.items.length > 0 ? (
            <Select
              value={draft.heygenAvatarLookId ?? ""}
              onValueChange={(next) =>
                patch({ heygenAvatarLookId: next || null })
              }
              disabled={disabled || looks.isLoading}
            >
              <SelectTrigger id="heygen-avatar-look" className="w-full">
                <SelectValue placeholder="Choose an avatar" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {looks.data.items.map((look) => (
                  <SelectItem key={look.id} value={look.id}>
                    {look.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="heygen-avatar-look"
              value={draft.heygenAvatarLookId ?? ""}
              disabled={disabled}
              placeholder={
                looks.isLoading
                  ? "Loading avatars…"
                  : "No avatars found — paste an avatar id"
              }
              onChange={(event) =>
                patch({ heygenAvatarLookId: event.target.value || null })
              }
            />
          )}
        </SettingField>

        <SettingField
          className="lg:col-span-3"
          label="Avatar model"
          htmlFor="heygen-engine"
          description={
            engineUnsupported ? (
              <span className="flex items-start gap-1.5 text-destructive">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                This avatar does not support {ENGINE_LABELS[draft.heygenAvatarEngine]}.
                HeyGen will reject the render.
              </span>
            ) : (
              ENGINE_HINTS[draft.heygenAvatarEngine]
            )
          }
        >
          <Select
            value={draft.heygenAvatarEngine}
            onValueChange={(next) =>
              patch({ heygenAvatarEngine: next as HeygenEngine })
            }
            disabled={disabled}
          >
            <SelectTrigger id="heygen-engine" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEYGEN_ENGINES.map((engine) => (
                <SelectItem
                  key={engine}
                  value={engine}
                  disabled={!allowedEngines.includes(engine)}
                >
                  {ENGINE_LABELS[engine]}
                  {!allowedEngines.includes(engine) && " · unsupported"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="Voice"
          htmlFor="heygen-voice"
          description={
            selectedVoice && !selectedVoice.supportsPause ? (
              <span className="flex items-start gap-1.5 text-status-pending-foreground dark:text-status-pending">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                This voice does not support pause tags. The script&apos;s SSML
                breaks will be ignored or read aloud.
              </span>
            ) : (
              "Only voices that support SSML pauses keep the script's pacing."
            )
          }
        >
          {voices.data && voices.data.items.length > 0 ? (
            <Select
              value={draft.heygenVoiceId ?? ""}
              onValueChange={(next) => patch({ heygenVoiceId: next || null })}
              disabled={disabled || voices.isLoading}
            >
              <SelectTrigger id="heygen-voice" className="w-full">
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {voices.data.items.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <Mic className="size-3.5 text-muted-foreground" />
                    {voice.name}
                    {voice.language ? ` · ${voice.language}` : ""}
                    {voice.supportsPause ? "" : " · no pauses"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="heygen-voice"
              value={draft.heygenVoiceId ?? ""}
              disabled={disabled}
              placeholder={voices.isLoading ? "Loading voices…" : "Voice id"}
              onChange={(event) =>
                patch({ heygenVoiceId: event.target.value || null })
              }
            />
          )}
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="Speaking speed"
          htmlFor="heygen-speed"
          description="HeyGen accepts 0.5 to 1.5."
        >
          <SliderField
            id="heygen-speed"
            min={0.5}
            max={1.5}
            step={0.05}
            value={draft.heygenVoiceSpeed}
            disabled={disabled}
            onChange={(value) => patch({ heygenVoiceSpeed: value })}
            format={(value) => `${value.toFixed(2)}x`}
          />
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="Locale"
          htmlFor="heygen-locale"
          description="Pronunciation variant, e.g. en-US or en-GB."
        >
          <Input
            id="heygen-locale"
            value={draft.heygenVoiceLocale}
            disabled={disabled}
            onChange={(event) =>
              patch({ heygenVoiceLocale: event.target.value })
            }
          />
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  )
}
