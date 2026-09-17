import { getHeygenConnection } from "@/lib/api/heygen"
import { getIntegrations } from "@/lib/api/integrations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import type { HeygenConnection } from "@/lib/types/heygen"
import type { IntegrationsResponse } from "@/lib/types/integrations"

export async function getAccessToken() {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()

  return data.session?.access_token ?? null
}

export async function loadHeygenConnection(): Promise<
  | { status: "connected"; connection: HeygenConnection }
  | { status: "disconnected" }
  | { status: "unavailable" }
> {
  const accessToken = await getAccessToken()
  if (!accessToken) return { status: "unavailable" }

  try {
    const { connection } = await getHeygenConnection({ accessToken })
    return connection
      ? { status: "connected", connection }
      : { status: "disconnected" }
  } catch {
    return { status: "unavailable" }
  }
}

export async function loadIntegrations(): Promise<
  | { status: "ok"; integrations: IntegrationsResponse }
  | { status: "unavailable"; message: string }
> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return { status: "unavailable", message: "No active session." }
  }

  try {
    return { status: "ok", integrations: await getIntegrations({ accessToken }) }
  } catch (error) {
    return {
      status: "unavailable",
      message:
        error instanceof Error
          ? error.message
          : "The integrations endpoint could not be reached.",
    }
  }
}
