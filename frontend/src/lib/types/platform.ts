export const PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "YOUTUBE",
  "TIKTOK",
  "X",
] as const

export type Platform = (typeof PLATFORMS)[number]

export type PlatformPostStatus = "pending" | "success" | "failed"

export interface PlatformPost {
  id: string
  scriptId: string
  platform: Platform
  platformPostId: string | null
  status: PlatformPostStatus
  error: string | null
  publishedAt: string | null
}
