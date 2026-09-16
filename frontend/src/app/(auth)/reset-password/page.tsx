import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata: Metadata = {
  title: "Choose a new password · ReelFlow",
}

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const params = await searchParams
  const email = typeof params.email === "string" ? params.email : ""

  return <ResetPasswordForm email={email} />
}
