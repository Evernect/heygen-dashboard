"use client"

import * as React from "react"
import { AlertTriangle, Clapperboard, Users } from "lucide-react"

import { AvatarPreview } from "@/components/settings/avatar-preview"
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
import { listAvatarGroups, listAvatarLooks } from "@/lib/api/settings"
import {
  ENGINE_HINTS,
  ENGINE_LABELS,
  HEYGEN_ENGINES,
  type AppSettings,
  type HeygenEngine,
} from "@/lib/types/settings"

type Patch = (patch: Partial<AppSettings>) => void

function looksLabel(count: number) {
  return `${count} look${count === 1 ? "" : "s"}`
}

export function HeygenSection({
  draft,
  patch,
  disabled,
}: {
  draft: AppSettings
  patch: Patch
  disabled?: boolean
}) {
  const groups = useAsyncData(() => listAvatarGroups({ limit: 50 }), [])

  const groupId = draft.heygenAvatarGroupId

  const looks = useAsyncData(
    () =>
      groupId
        ? listAvatarLooks({ groupId, limit: 50 })
        : Promise.resolve({ items: [], hasMore: false, nextToken: null }),
    [groupId]
  )

  const selectedGroup = groups.data?.items.find((group) => group.id === groupId)
  const selectedLook =
    looks.data?.items.find((look) => look.id === draft.heygenAvatarLookId) ??
    null

  const allowedEngines: HeygenEngine[] =
    selectedLook && selectedLook.supportedEngines.length > 0
      ? selectedLook.supportedEngines
      : [...HEYGEN_ENGINES]

  const engineUnsupported =
    selectedLook !== null &&
    selectedLook.supportedEngines.length > 0 &&
    !selectedLook.supportedEngines.includes(draft.heygenAvatarEngine)

  const catalogError = groups.error ?? looks.error

  function handleGroupChange(nextGroupId: string | null) {
    patch({
      heygenAvatarGroupId: nextGroupId || null,
      heygenAvatarLookId: null,
    })
  }

  return (
    <SettingsSection
      icon={Clapperboard}
      title="HeyGen render"
      description="Which avatar speaks the script, in which look, on which rendering engine. The avatar's own voice is used."
    >
      <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-stretch lg:gap-6">
        <SettingsGrid className="w-full flex-1">
          {catalogError && (
            <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive sm:col-span-2 lg:col-span-6">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Could not reach HeyGen ({catalogError.message}). The look id
                below can still be typed in by hand and saved.
              </span>
            </p>
          )}

          <SettingField
            className="lg:col-span-3"
            label="Avatar"
            htmlFor="heygen-avatar-group"
            description={
              groups.data?.hasMore
                ? "Showing the first 50 avatars on your account."
                : selectedGroup
                  ? `${looksLabel(selectedGroup.looksCount)} available.`
                  : "The character. Each one has its own set of looks."
            }
          >
            <Select
              value={groupId ?? ""}
              onValueChange={handleGroupChange}
              disabled={disabled || groups.isLoading}
            >
              <SelectTrigger id="heygen-avatar-group" className="w-full">
                <SelectValue>
                  {(value: string) =>
                    value ? (
                      <>
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className="truncate">
                          {selectedGroup?.name ?? value}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {groups.isLoading
                          ? "Loading avatars…"
                          : "Choose an avatar"}
                      </span>
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {groups.data?.items.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <Users className="size-3.5 text-muted-foreground" />
                    {group.name}
                    <span className="text-muted-foreground">
                      {` · ${looksLabel(group.looksCount)}`}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingField>

          <SettingField
            className="lg:col-span-3"
            label="Look"
            htmlFor="heygen-avatar-look"
            description={
              looks.data?.hasMore
                ? "Showing the first 50 looks in this avatar."
                : "The outfit and framing. This is the id HeyGen renders with."
            }
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
                  <SelectValue>
                    {(value: string) =>
                      value ? (
                        <span className="truncate">
                          {selectedLook?.name ?? value}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Choose a look
                        </span>
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {looks.data.items.map((look) => (
                    <SelectItem
                      key={look.id}
                      value={look.id}
                      disabled={
                        look.status !== null && look.status !== "completed"
                      }
                    >
                      {look.name}
                      {look.status && look.status !== "completed"
                        ? ` · ${look.status}`
                        : ""}
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
                  !groupId
                    ? "Choose an avatar first"
                    : looks.isLoading
                      ? "Loading looks…"
                      : "No looks found — paste a look id"
                }
                onChange={(event) =>
                  patch({ heygenAvatarLookId: event.target.value || null })
                }
              />
            )}
          </SettingField>

          <SettingField
            className="lg:col-span-2"
            label="Avatar model"
            htmlFor="heygen-engine"
            description={
              engineUnsupported ? (
                <span className="flex items-start gap-1.5 text-destructive">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  This look does not support{" "}
                  {ENGINE_LABELS[draft.heygenAvatarEngine]}. HeyGen will reject
                  the render.
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
                <SelectValue>
                  {(value: HeygenEngine) => ENGINE_LABELS[value] ?? value}
                </SelectValue>
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

        <AvatarPreview
          className="lg:aspect-auto lg:min-h-48 lg:self-stretch"
          look={selectedLook}
          isLoading={Boolean(groupId) && looks.isLoading}
        />
      </div>
    </SettingsSection>
  )
}
