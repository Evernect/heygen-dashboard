"use client"

import * as React from "react"
import { Loader2, Save, UserRound } from "lucide-react"

import { SettingField } from "@/components/settings/setting-field"
import {
  SettingsGrid,
  SettingsSection,
} from "@/components/settings/settings-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { getCampaignProfile, saveCampaignProfile } from "@/lib/api/news-config"
import type { CampaignProfile } from "@/lib/types/news-config"

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

const EMPTY: CampaignProfile = {
  userId: "",
  candidateName: "",
  party: "",
  office: "",
  district: "",
  districtDescription: "",
  districtTerms: [],
  state: "",
  electionDate: null,
  personaSummary: "",
  timezone: "America/Los_Angeles",
  newsRunHour: 7,
  topicsPerRun: 3,
  newsEnabled: true,
  createdAt: "",
  updatedAt: "",
}

/** A date input wants YYYY-MM-DD, the API returns an ISO timestamp. */
function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ""
}

/**
 * The campaign profile, with its own save button.
 *
 * Kept out of the main settings form on purpose: that form's dirty-tracking
 * compares fields with `===`, which cannot see a change inside
 * `districtTerms`.
 */
export function CampaignProfileSection() {
  const { notifySuccess, notifyError } = useToastFeedback()
  const { data, isLoading, refetch } = useAsyncData(
    () => getCampaignProfile(),
    []
  )

  const [draft, setDraft] = React.useState<CampaignProfile>(EMPTY)
  const [isSaving, setIsSaving] = React.useState(false)

  const fetched = data?.profile ?? null
  const [seeded, setSeeded] = React.useState(false)
  if (data && !seeded) {
    setSeeded(true)
    if (fetched) setDraft({ ...EMPTY, ...fetched })
  }

  const timezones = data?.timezones ?? [draft.timezone]

  function patch(partial: Partial<CampaignProfile>) {
    setDraft((current) => ({ ...current, ...partial }))
  }

  const canSave = draft.candidateName.trim().length > 0

  async function handleSave() {
    if (!canSave) return

    setIsSaving(true)
    try {
      await saveCampaignProfile({
        candidateName: draft.candidateName.trim(),
        party: draft.party || null,
        office: draft.office || null,
        district: draft.district || null,
        districtDescription: draft.districtDescription || null,
        districtTerms: draft.districtTerms,
        state: draft.state || null,
        electionDate: draft.electionDate || null,
        personaSummary: draft.personaSummary || null,
        timezone: draft.timezone,
        newsRunHour: draft.newsRunHour,
        topicsPerRun: draft.topicsPerRun,
        newsEnabled: draft.newsEnabled,
      })

      notifySuccess("Campaign profile saved", "Tomorrow's run will use it.")
      await refetch()
    } catch (caught) {
      notifyError("Could not save the profile", caught)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SettingsSection
      icon={UserRound}
      title="Campaign"
      description="Who the pipeline is writing for. This is what the selector and the angle writer are told, so keep it accurate — it also decides which stories count as local."
    >
      <SettingsGrid>
        <SettingField
          className="lg:col-span-3"
          label="Candidate name"
          htmlFor="candidate-name"
          description="Also used to detect stories that name the candidate."
        >
          <Input
            id="candidate-name"
            value={draft.candidateName}
            disabled={isLoading || isSaving}
            onChange={(event) => patch({ candidateName: event.target.value })}
            placeholder="Ted Nordblum"
          />
        </SettingField>

        <SettingField className="lg:col-span-1" label="Party" htmlFor="party">
          <Input
            id="party"
            value={draft.party ?? ""}
            disabled={isLoading || isSaving}
            onChange={(event) => patch({ party: event.target.value })}
            placeholder="Republican"
          />
        </SettingField>

        <SettingField className="lg:col-span-2" label="Office" htmlFor="office">
          <Input
            id="office"
            value={draft.office ?? ""}
            disabled={isLoading || isSaving}
            onChange={(event) => patch({ office: event.target.value })}
            placeholder="California State Assembly"
          />
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="District"
          htmlFor="district"
        >
          <Input
            id="district"
            value={draft.district ?? ""}
            disabled={isLoading || isSaving}
            onChange={(event) => patch({ district: event.target.value })}
            placeholder="Assembly District 42"
          />
        </SettingField>

        <SettingField className="lg:col-span-2" label="State" htmlFor="state">
          <Input
            id="state"
            value={draft.state ?? ""}
            disabled={isLoading || isSaving}
            onChange={(event) => patch({ state: event.target.value })}
            placeholder="California"
          />
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="Election date"
          htmlFor="election-date"
        >
          <Input
            id="election-date"
            type="date"
            value={toDateInput(draft.electionDate)}
            disabled={isLoading || isSaving}
            onChange={(event) =>
              patch({ electionDate: event.target.value || null })
            }
          />
        </SettingField>

        <SettingField
          className="sm:col-span-2 lg:col-span-6"
          label="District description"
          htmlFor="district-description"
          description="Prose, for the prompt. e.g. Ventura and western Los Angeles counties."
        >
          <Input
            id="district-description"
            value={draft.districtDescription ?? ""}
            disabled={isLoading || isSaving}
            onChange={(event) =>
              patch({ districtDescription: event.target.value })
            }
            placeholder="Ventura and western Los Angeles counties"
          />
        </SettingField>

        <SettingField
          className="sm:col-span-2 lg:col-span-6"
          label="Local place names"
          htmlFor="district-terms"
          description="Comma separated. A story mentioning any of these is scored as local, whichever keyword found it."
        >
          <Input
            id="district-terms"
            value={draft.districtTerms.join(", ")}
            disabled={isLoading || isSaving}
            onChange={(event) =>
              patch({
                districtTerms: event.target.value
                  .split(",")
                  .map((term) => term.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Thousand Oaks, Simi Valley, Moorpark, Camarillo, Malibu"
          />
        </SettingField>

        <SettingField
          className="sm:col-span-2 lg:col-span-6"
          label="Anything else the model should know"
          htmlFor="persona"
          description="Optional. Appended to the description of the candidate in both prompts."
        >
          <Textarea
            id="persona"
            rows={3}
            value={draft.personaSummary ?? ""}
            disabled={isLoading || isSaving}
            onChange={(event) => patch({ personaSummary: event.target.value })}
          />
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="Run at"
          htmlFor="run-hour"
          description="Local time, in the zone below."
        >
          <Select
            value={String(draft.newsRunHour)}
            onValueChange={(next) => patch({ newsRunHour: Number(next) })}
            disabled={isLoading || isSaving}
          >
            <SelectTrigger id="run-hour" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {HOURS.map((hour) => (
                <SelectItem key={hour} value={String(hour)}>
                  {String(hour).padStart(2, "0")}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="Timezone"
          htmlFor="timezone"
        >
          <Select
            value={draft.timezone}
            onValueChange={(next) => patch({ timezone: next ?? "UTC" })}
            disabled={isLoading || isSaving}
          >
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {timezones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingField>

        <SettingField
          className="lg:col-span-2"
          label="Topics per run"
          htmlFor="topics-per-run"
          description="The model returns fewer when fewer are worth it."
        >
          <Input
            id="topics-per-run"
            type="number"
            min={1}
            max={5}
            value={draft.topicsPerRun}
            disabled={isLoading || isSaving}
            onChange={(event) =>
              patch({ topicsPerRun: Number(event.target.value) })
            }
          />
        </SettingField>

        <SettingField
          className="sm:col-span-2 lg:col-span-6"
          label="Run every morning"
          description="Turn off to keep the configuration but stop the scheduled run. Run now still works."
          control={
            <Switch
              checked={draft.newsEnabled}
              disabled={isLoading || isSaving}
              onCheckedChange={(checked) => patch({ newsEnabled: checked })}
            />
          }
        />
      </SettingsGrid>

      <div className="mt-5 flex justify-end border-t pt-4">
        <Button onClick={() => void handleSave()} disabled={!canSave || isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          {isSaving ? "Saving…" : "Save campaign"}
        </Button>
      </div>
    </SettingsSection>
  )
}
