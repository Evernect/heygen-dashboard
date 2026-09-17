import type { HeygenConnection } from "@/lib/types/heygen"
import type { Platform } from "@/lib/types/platform"

/**
 * Meta credentials still come from the backend environment, so this is
 * derived per deployment rather than stored per user. Only presence is
 * reported — the access token itself never leaves the server.
 */
export interface MetaPlatformStatus {
  platform: Platform
  /** Both a target and an access token are present, so publishing can work. */
  configured: boolean
  /** The page or account id is set, whether or not the token is. */
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
