/**
 * What the dashboard is allowed to know about a stored HeyGen key: which
 * account it belongs to and a masked hint, never the key itself.
 */
export interface HeygenConnection {
  connected: true
  apiKeyHint: string
  accountEmail: string | null
  accountUsername: string | null
  connectedAt: string
  lastVerifiedAt: string | null
  updatedAt: string
}

export interface HeygenConnectionResponse {
  connection: HeygenConnection | null
}
