export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set. Add them to frontend/.env.local and restart the dev server."
    )
    this.name = "SupabaseConfigError"
  }
}

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
)

export function requireSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) throw new SupabaseConfigError()
  return { url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY }
}
