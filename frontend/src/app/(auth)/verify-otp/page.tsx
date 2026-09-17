import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { VerifyOtpForm } from "@/components/auth/verify-otp-form"

export const metadata: Metadata = {
  title: "Verify your email · ReelFlow",
}

export default async function VerifyOtpPage({
  searchParams,
}: PageProps<"/verify-otp">) {
  const params = await searchParams
  const email = typeof params.email === "string" ? params.email : ""

  if (!email) redirect("/signup")

  return <VerifyOtpForm email={email} />
}
