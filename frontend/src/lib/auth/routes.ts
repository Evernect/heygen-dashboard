import { NAV_ITEMS } from "@/lib/constants/navigation"

/** Where a signed-in user lands when no explicit destination is given. */
export const DEFAULT_SIGNED_IN_ROUTE = "/approvals"

/** Onboarding: where a user without a HeyGen account connected is sent. */
export const CONNECT_HEYGEN_ROUTE = "/connect-heygen"

/**
 * Every dashboard route is derived from the sidebar, so the two never drift.
 * Onboarding is added by hand — it needs a session but has no sidebar entry.
 */
export const PROTECTED_ROUTES = [
  ...NAV_ITEMS.map((item) => item.href),
  CONNECT_HEYGEN_ROUTE,
]

/** Routes that make no sense to visit while already signed in. */
export const GUEST_ONLY_ROUTES = ["/login", "/signup", "/forgot-password"]

function matches(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function isProtectedRoute(pathname: string) {
  return matches(pathname, PROTECTED_ROUTES)
}

export function isGuestOnlyRoute(pathname: string) {
  return matches(pathname, GUEST_ONLY_ROUTES)
}

/**
 * Only same-origin, absolute paths are accepted as a redirect target, so a
 * crafted `?next=https://evil.example` cannot turn sign-in into an open
 * redirect.
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_SIGNED_IN_ROUTE
) {
  if (!next) return fallback
  if (!next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}
