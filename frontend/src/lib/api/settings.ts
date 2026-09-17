import { api } from "./client"
import type {
  AppSettings,
  HeygenAvatarGroup,
  HeygenAvatarLook,
  HeygenPage,
  OpenAiModel,
  SettingsResponse,
  UpdateSettingsInput,
} from "@/lib/types/settings"

export function getSettings() {
  return api.get<SettingsResponse>("api/settings")
}

export function updateSettings(input: UpdateSettingsInput) {
  return api.patch<{ settings: AppSettings }>("api/settings", input)
}

export function listAvatarGroups(params?: {
  ownership?: "public" | "private"
  limit?: number
}) {
  return api.get<HeygenPage<HeygenAvatarGroup>>(
    "api/settings/heygen/avatar-groups",
    {
      query: {
        ownership: params?.ownership ?? "private",
        limit: params?.limit ?? 50,
      },
    }
  )
}

export function listAvatarLooks(params?: {
  groupId?: string | null
  ownership?: "public" | "private"
  limit?: number
}) {
  return api.get<HeygenPage<HeygenAvatarLook>>(
    "api/settings/heygen/avatar-looks",
    {
      query: {
        groupId: params?.groupId ?? undefined,
        ownership: params?.ownership,
        limit: params?.limit ?? 50,
      },
    }
  )
}

export function listOpenAiModels() {
  return api.get<{ items: OpenAiModel[] }>("api/settings/openai/models")
}
