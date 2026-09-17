import { api } from "./client"
import type { HeygenConnectionResponse } from "@/lib/types/heygen"

const PATH = "api/heygen/connection"

export function getHeygenConnection(options?: { accessToken?: string | null }) {
  return api.get<HeygenConnectionResponse>(PATH, options)
}

/**
 * Connect, or replace the stored key. The backend proves the key works
 * against HeyGen before saving, so a rejected key fails here rather than
 * silently at render time.
 */
export function saveHeygenConnection(apiKey: string) {
  return api.put<HeygenConnectionResponse>(PATH, { apiKey })
}

export function disconnectHeygen() {
  return api.delete<HeygenConnectionResponse>(PATH)
}
