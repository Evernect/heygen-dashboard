import Link from "next/link"

import { ReelflowWordmark } from "@/components/landing/reelflow-wordmark"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import { getCurrentUser } from "@/lib/auth/user"

export const dynamic = "force-dynamic"

export default async function OnboardingLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/">
          <ReelflowWordmark />
        </Link>

        <div className="flex items-center gap-2">
          <ModeToggle />
          {user && <UserMenu user={user} />}
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-16">
        <div className="my-auto w-full max-w-xl py-8">{children}</div>
      </main>
    </div>
  )
}
