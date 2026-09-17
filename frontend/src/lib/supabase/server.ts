import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { requireSupabaseConfig } from "@/lib/supabase/config"

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
        }
      },
    },
  })
}
