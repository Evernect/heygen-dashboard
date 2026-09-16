import type { Metadata } from "next"
import Link from "next/link"
import { TriangleAlertIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Sign-in failed · ReelFlow",
}

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-5 text-center">
        <TriangleAlertIcon className="mx-auto size-8 text-destructive" />
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            We couldn&apos;t complete that sign-in
          </h1>
          <p className="text-sm text-muted-foreground">
            The link expired or was already used. Start again and you&apos;ll be
            straight back in.
          </p>
        </div>
        <Link
          href="/login"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          Back to sign in
        </Link>
      </div>
    </main>
  )
}
