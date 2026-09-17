import { NAV_ITEMS } from "@/lib/constants/navigation"

export const DEFAULT_SIGNED_IN_ROUTE = "/approvals"

export const CONNECT_HEYGEN_ROUTE = "/connect-heygen"

export const PROTECTED_ROUTES = [
  ...NAV_ITEMS.map((item) => item.href),
  CONNECT_HEYGEN_ROUTE,
]

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

export function safeRedirectPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_SIGNED_IN_ROUTE
) {
  if (!next) return fallback
  if (!next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}
