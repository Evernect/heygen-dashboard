import { api } from "./client"
import type {
  AppSettings,
  HeygenAvatarLook,
  HeygenPage,
  HeygenVoice,
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

export function listAvatarLooks(params?: {
  ownership?: "public" | "private"
  limit?: number
}) {
  return api.get<HeygenPage<HeygenAvatarLook>>(
    "api/settings/heygen/avatar-looks",
    {
      query: {
        ownership: params?.ownership,
        limit: params?.limit ?? 50,
      },
    }
  )
}

export function listVoices(params?: {
  language?: string
  gender?: "male" | "female"
  limit?: number
}) {
  return api.get<HeygenPage<HeygenVoice>>("api/settings/heygen/voices", {
    query: {
      language: params?.language,
      gender: params?.gender,
      limit: params?.limit ?? 100,
    },
  })
}

export function listOpenAiModels() {
  return api.get<{ items: OpenAiModel[] }>("api/settings/openai/models")
}
