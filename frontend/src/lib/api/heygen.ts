import { api } from "./client"
import type { HeygenConnectionResponse } from "@/lib/types/heygen"

const PATH = "api/heygen/connection"

export function getHeygenConnection(options?: { accessToken?: string | null }) {
  return api.get<HeygenConnectionResponse>(PATH, options)
}

export function saveHeygenConnection(apiKey: string) {
  return api.put<HeygenConnectionResponse>(PATH, { apiKey })
}

export function disconnectHeygen() {
  return api.delete<HeygenConnectionResponse>(PATH)
}
