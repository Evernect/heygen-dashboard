import Link from "next/link"

import { AuthShowcase } from "@/components/auth/auth-showcase"
import { ReelflowWordmark } from "@/components/landing/reelflow-wordmark"
import { ModeToggle } from "@/components/theme/mode-toggle"

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    // Fixed to one viewport: the form column scrolls on its own when a form
    // is taller than the screen, so the page itself never does and the
    // showcase panel never moves.
    <div className="grid h-svh lg:grid-cols-2">
      <AuthShowcase />

      <div className="relative flex h-full min-h-0 flex-col overflow-y-auto">
        {/*
          Overlaid rather than a header row: on a short viewport a 60px band
          of chrome above the form is the difference between fitting and
          scrolling.
        */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 lg:justify-end">
          <Link href="/" className="pointer-events-auto lg:hidden">
            <ReelflowWordmark />
          </Link>
          <div className="pointer-events-auto">
            <ModeToggle />
          </div>
        </div>

        {/*
          `my-auto` rather than `items-center`: centring a flex child that is
          taller than its container puts the top of the child out of reach of
          the scrollbar. Auto margins collapse instead of overflowing.
        */}
        <main className="flex flex-1 justify-center px-4 py-14 lg:py-5">
          <div className="my-auto w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  )
}
