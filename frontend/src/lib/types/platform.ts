export const PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "YOUTUBE",
  "TIKTOK",
  "X",
] as const

export type Platform = (typeof PLATFORMS)[number]

/** Matches the PlatformPostStatus enum the API returns, which is uppercase. */
export type PlatformPostStatus = "PENDING" | "SUCCESS" | "FAILED"

export interface PlatformPost {
  id: string
  scriptId: string
  platform: Platform
  platformPostId: string | null
  status: PlatformPostStatus
  error: string | null
  publishedAt: string | null
}
