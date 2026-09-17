import type { HeygenConnection } from "@/lib/types/heygen"
import type { Platform } from "@/lib/types/platform"

export interface MetaPlatformStatus {
  platform: Platform
  configured: boolean
  targetConfigured: boolean
}

export interface MetaStatus {
  source: "environment"
  dryRun: boolean
  accessTokenConfigured: boolean
  platforms: MetaPlatformStatus[]
}

export interface IntegrationsResponse {
  heygen: { connection: HeygenConnection | null }
  meta: MetaStatus
}
