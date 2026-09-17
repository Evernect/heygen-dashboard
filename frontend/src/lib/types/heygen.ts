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
