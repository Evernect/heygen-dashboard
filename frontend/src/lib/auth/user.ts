import type { JwtPayload } from "@supabase/supabase-js"

import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"

export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  initials: string
}

function initialsFrom(name: string, email: string) {
  const source = name.trim() || email
  const parts = source.split(/[\s@._-]+/).filter(Boolean)

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

function text(value: unknown) {
  return typeof value === "string" && value ? value : null
}

export function toAuthUser(claims: JwtPayload): AuthUser {
  const metadata = claims.user_metadata ?? {}
  const email = claims.email ?? ""
  // Google writes the display name to the same key as our signup action.
  const fullName =
    text(metadata.full_name) ?? text(metadata.name) ?? email

  return {
    id: claims.sub,
    email,
    fullName,
    avatarUrl: text(metadata.avatar_url) ?? text(metadata.picture),
    initials: initialsFrom(fullName, email),
  }
}

/**
 * Authoritative identity check for server components. Returns null when the
 * request has no valid session — callers decide whether to redirect.
 *
 * Deliberately a single `getClaims()` call: it verifies the JWT signature
 * locally and already carries the email and user metadata. Adding `getUser()`
 * on top would mean a second auth round-trip per render, and a second chance
 * to race the proxy's token refresh ("Invalid Refresh Token: Already Used").
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  // Without credentials nobody can be signed in. Returning null sends the
  // visitor to /login instead of crashing every dashboard route.
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null

  return toAuthUser(data.claims)
}
