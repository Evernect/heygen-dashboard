import type { Platform } from "@/lib/types/platform"

export interface PlatformMeta {
  label: string
  short: string
  dotClassName: string
}

export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  FACEBOOK: {
    label: "Facebook",
    short: "FB",
    dotClassName: "bg-[oklch(0.55_0.18_255)]",
  },
  INSTAGRAM: {
    label: "Instagram",
    short: "IG",
    dotClassName: "bg-[oklch(0.62_0.21_5)]",
  },
  YOUTUBE: {
    label: "YouTube",
    short: "YT",
    dotClassName: "bg-[oklch(0.6_0.22_25)]",
  },
  TIKTOK: {
    label: "TikTok",
    short: "TT",
    dotClassName: "bg-[oklch(0.65_0.16_185)]",
  },
  X: {
    label: "X",
    short: "X",
    dotClassName: "bg-foreground",
  },
}

export const PUBLISHABLE_PLATFORMS: Platform[] = ["FACEBOOK", "INSTAGRAM"]

export function isPublishable(platform: Platform) {
  return PUBLISHABLE_PLATFORMS.includes(platform)
}
