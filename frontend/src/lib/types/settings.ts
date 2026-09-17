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
  /** The Supabase user these settings belong to. Settings are per-tenant. */
  userId: string

  heygenAvatarGroupId: string | null
  heygenAvatarLookId: string | null
  heygenAvatarEngine: HeygenEngine
  heygenVoiceSpeed: number
  heygenVoiceLocale: string

  openaiModel: string
  openaiReasoningEffort: ReasoningEffort | null
  openaiSendTemperature: boolean
  openaiTemperature: number

  targetWordsMin: number
  targetWordsMax: number
}

export type UpdateSettingsInput = Partial<Omit<AppSettings, "userId">>

export interface SettingsResponse {
  settings: AppSettings
  options: {
    heygenEngines: HeygenEngine[]
    reasoningEfforts: ReasoningEffort[]
  }
}

/** A character. Holds one or more looks — outfits, poses, framings. */
export interface HeygenAvatarGroup {
  id: string
  name: string
  gender: string | null
  previewImageUrl: string | null
  previewVideoUrl: string | null
  looksCount: number
  status: string | null
}

export interface HeygenAvatarLook {
  id: string
  name: string
  groupId: string | null
  avatarType: string | null
  gender: string | null
  previewImageUrl: string | null
  /** Null for photo avatars, which only ever have a still. */
  previewVideoUrl: string | null
  supportedEngines: HeygenEngine[]
  preferredOrientation: string | null
  status: string | null
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
