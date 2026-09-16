import type { Metadata } from "next"

import { LoginForm } from "@/components/auth/login-form"
import { safeRedirectPath } from "@/lib/auth/routes"

export const metadata: Metadata = {
  title: "Sign in · ReelFlow",
}

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams
  const next = typeof params.next === "string" ? params.next : null

  return <LoginForm next={safeRedirectPath(next)} />
}
