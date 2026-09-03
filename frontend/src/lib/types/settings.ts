export const HEYGEN_ENGINES = ["avatar_iii", "avatar_iv", "avatar_v"] as const
export type HeygenEngine = (typeof HEYGEN_ENGINES)[number]

export const REASONING_EFFORTS = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number]

export interface AppSettings {
  id: string

  heygenAvatarGroupId: string | null
  heygenAvatarLookId: string | null
  heygenAvatarEngine: HeygenEngine
  heygenVoiceId: string | null
  heygenVoiceSpeed: number
  heygenVoiceLocale: string

  openaiModel: string
  openaiReasoningEffort: ReasoningEffort | null
  openaiSendTemperature: boolean
  openaiTemperature: number

  targetWordsMin: number
  targetWordsMax: number
}

export type UpdateSettingsInput = Partial<Omit<AppSettings, "id">>

export interface SettingsResponse {
  settings: AppSettings
  options: {
    heygenEngines: HeygenEngine[]
    reasoningEfforts: ReasoningEffort[]
  }
}

export interface HeygenAvatarGroup {
  id: string
  name: string
  gender: string | null
  looksCount: number | null
  previewImageUrl: string | null
  defaultVoiceId: string | null
}

export interface HeygenAvatarLook {
  id: string
  name: string
  groupId: string | null
  avatarType: string | null
  gender: string | null
  previewImageUrl: string | null
  defaultVoiceId: string | null
  supportedEngines: HeygenEngine[]
  preferredOrientation: string | null
}

export interface HeygenVoice {
  id: string
  name: string
  language: string | null
  gender: string | null
  previewAudioUrl: string | null
  supportsPause: boolean
  supportsLocale: boolean
  type: string | null
}

export interface HeygenPage<T> {
  items: T[]
  hasMore: boolean
  nextToken: string | null
}

export interface OpenAiModel {
  id: string
  created: number | null
}

export const ENGINE_LABELS: Record<HeygenEngine, string> = {
  avatar_iii: "Avatar III",
  avatar_iv: "Avatar IV",
  avatar_v: "Avatar V",
}

export const ENGINE_HINTS: Record<HeygenEngine, string> = {
  avatar_iii: "Photo-to-video pipeline for photo and video avatars.",
  avatar_iv: "HeyGen's default engine, with the broadest avatar support.",
  avatar_v: "Highest fidelity, using cross-reference-driven animation.",
}
