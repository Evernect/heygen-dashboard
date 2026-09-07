"use client"

import * as React from "react"
import { AlertTriangle, Brain } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import { useAsyncData } from "@/hooks/use-async-data"
import { listOpenAiModels } from "@/lib/api/settings"
import {
  REASONING_EFFORTS,
  type AppSettings,
  type ReasoningEffort,
} from "@/lib/types/settings"

const MODEL_DEFAULT = "__model_default__"

export function OpenAiSection({
  draft,
  patch,
  disabled,
}: {
  draft: AppSettings
  patch: (patch: Partial<AppSettings>) => void
  disabled?: boolean
}) {
  const models = useAsyncData(() => listOpenAiModels(), [])

  const modelIds = React.useMemo(() => {
    const ids = models.data?.items.map((model) => model.id) ?? []
    return ids.includes(draft.openaiModel) ? ids : [draft.openaiModel, ...ids]
  }, [models.data, draft.openaiModel])

  const effortBlocksTemperature =
    draft.openaiReasoningEffort !== null &&
    draft.openaiReasoningEffort !== "none"

  return (
    <SettingsSection
      icon={Brain}
      title="Script generation"
      description="The model that turns a topic into a script and its captions."
    >
      <SettingsGrid>
        <SettingField
          className="lg:col-span-3"
          label="Model"
          htmlFor="openai-model"
          description={
            models.error
              ? `Could not list models (${models.error.message}). Type an id instead.`
              : "Listed live from your OpenAI account."
          }
        >
          {modelIds.length > 1 && !models.error ? (
            <Select
              value={draft.openaiModel}
              onValueChange={(next) => patch({ openaiModel: next ?? "" })}
              disabled={disabled || models.isLoading}
            >
              <SelectTrigger id="openai-model" className="w-full">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {modelIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="openai-model"
              value={draft.openaiModel}
              disabled={disabled}
              placeholder={models.isLoading ? "Loading models…" : "Model id"}
              onChange={(event) => patch({ openaiModel: event.target.value })}
            />
          )}
        </SettingField>

        <SettingField
          className="lg:col-span-3"
          label="Reasoning effort"
          htmlFor="openai-effort"
          description="Leave unset to use the model's own default. Non-reasoning models reject this entirely."
        >
          <Select
            value={draft.openaiReasoningEffort ?? MODEL_DEFAULT}
            onValueChange={(next) =>
              patch({
                openaiReasoningEffort:
                  next === MODEL_DEFAULT ? null : (next as ReasoningEffort),
              })
            }
            disabled={disabled}
          >
            <SelectTrigger id="openai-effort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MODEL_DEFAULT}>Model default</SelectItem>
              {REASONING_EFFORTS.map((effort) => (
                <SelectItem key={effort} value={effort}>
                  {effort}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingField>

        <SettingField
          className="sm:col-span-2 lg:col-span-6"
          label="Temperature"
          htmlFor="openai-temperature"
          control={
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              Send temperature
              <Switch
                checked={draft.openaiSendTemperature}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  patch({ openaiSendTemperature: checked === true })
                }
              />
            </label>
          }
          description={
            effortBlocksTemperature && draft.openaiSendTemperature ? (
              <span className="flex items-start gap-1.5 text-status-pending-foreground dark:text-status-pending">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                Reasoning models only accept temperature at effort{" "}
                <code className="font-mono">none</code>. This request will most
                likely be retried without it.
              </span>
            ) : (
              "Higher is more varied, lower is more repeatable. Many reasoning models reject this parameter outright."
            )
          }
        >
          <SliderField
            id="openai-temperature"
            min={0}
            max={2}
            step={0.05}
            value={draft.openaiTemperature}
            disabled={disabled || !draft.openaiSendTemperature}
            onChange={(value) => patch({ openaiTemperature: value })}
            format={(value) => value.toFixed(2)}
          />
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  )
}
