import Link from "next/link"

import { ReelflowWordmark } from "@/components/landing/reelflow-wordmark"
import { CurrentYear } from "@/components/shared/current-year"
import { Separator } from "@/components/ui/separator"
import { NAV_ITEMS } from "@/lib/constants/navigation"

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <ReelflowWordmark />
            <p className="mt-3 text-sm text-pretty text-muted-foreground">
              Generate, review, schedule and publish short-form campaign videos
              from a bank of topics.
            </p>
          </div>

          <nav className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Workspace
            </p>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <Separator className="my-8" />

        <p className="text-xs text-muted-foreground">
          © <CurrentYear fallback={new Date().getFullYear()} /> ReelFlow
        </p>
      </div>
    </footer>
  )
}
