import { api } from "./client"
import type { IntegrationsResponse } from "@/lib/types/integrations"

export function getIntegrations(options?: { accessToken?: string | null }) {
  return api.get<IntegrationsResponse>("api/integrations", options)
}
