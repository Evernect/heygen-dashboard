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

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured) return null

  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null

  return toAuthUser(data.claims)
}
