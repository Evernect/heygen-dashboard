import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import {
  DEFAULT_SIGNED_IN_ROUTE,
  isGuestOnlyRoute,
  isProtectedRoute,
} from "@/lib/auth/routes"
import { isSupabaseConfigured, requireSupabaseConfig } from "@/lib/supabase/config"

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next({ request })

  const { url, key } = requireSupabaseConfig()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value)
        }
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [header, headerValue] of Object.entries(headers)) {
          response.headers.set(header, headerValue)
        }
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data?.claims)

  const { pathname, search } = request.nextUrl

  if (!isSignedIn && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.search = ""
    redirectUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(redirectUrl)
  }

  if (isSignedIn && isGuestOnlyRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = DEFAULT_SIGNED_IN_ROUTE
    redirectUrl.search = ""
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
