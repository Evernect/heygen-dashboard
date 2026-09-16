import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { requireSupabaseConfig } from "@/lib/supabase/config"

/**
 * Creates a request-scoped Supabase client. Never share the returned client
 * across requests — call this once per render, route handler or server action.
 */
export async function createClient() {
  const { url, key } = requireSupabaseConfig()
  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot write cookies. Token refreshes are
          // written back by src/proxy.ts instead, so this is safe to ignore.
        }
      },
    },
  })
}
