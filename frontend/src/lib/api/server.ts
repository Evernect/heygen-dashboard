import { getHeygenConnection } from "@/lib/api/heygen"
import { getIntegrations } from "@/lib/api/integrations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import type { HeygenConnection } from "@/lib/types/heygen"
import type { IntegrationsResponse } from "@/lib/types/integrations"

/**
 * The access token for the current request, for backend calls made during a
 * server render. `getSession()` rather than `getClaims()` because only the
 * session carries the raw token the API needs to forward.
 */
export async function getAccessToken() {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()
  const { data } = await supabase.auth.getSession()

  return data.session?.access_token ?? null
}

/**
 * Reads the connection during a server render.
 *
 * `status: "unavailable"` is deliberately distinct from "not connected": if
 * the API is down, gating the dashboard on a failed fetch would lock everyone
 * out of an app that is otherwise fine.
 */
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

/**
 * The integrations overview during a server render. Like the connection load
 * above, a failed fetch is reported rather than thrown, so an API outage shows
 * an error state on the page instead of a crashed route.
 */
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
