import Link from "next/link"
import { SparklesIcon } from "lucide-react"

import { ReelflowWordmark } from "@/components/landing/reelflow-wordmark"
import { PIPELINE_STAGES } from "@/lib/constants/landing"

/**
 * Left-hand marketing panel shared by every auth screen. Hidden below `lg`,
 * where the form takes the full width.
 *
 * The three rows are wordmark / content / footer. Only the middle row may
 * shrink, and the stage list drops out entirely on short viewports rather
 * than pushing the footer over it.
 */
export function AuthShowcase() {
  return (
    <div className="relative isolate hidden h-full min-h-0 flex-col justify-between gap-8 overflow-hidden border-r border-border bg-muted/30 p-8 lg:flex xl:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_35%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-24 -z-10 size-[34rem] rounded-full bg-[image:var(--brand-gradient)] opacity-[0.14] blur-3xl"
      />

      <Link href="/" className="w-fit shrink-0">
        <ReelflowWordmark />
      </Link>

      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--brand-blue),transparent_65%)] bg-[color-mix(in_oklch,var(--brand-blue),var(--background)_92%)] px-3 py-1 text-xs font-medium text-[var(--brand-blue-dark)] dark:text-[var(--brand-blue)]">
            <SparklesIcon className="size-3.5" />
            AI script → avatar video → auto-publish
          </span>

          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-balance xl:text-4xl">
            One topic in.
            <br />
            <span className="bg-[image:var(--brand-gradient-text)] bg-clip-text pr-1 text-transparent">
              Published reels out.
            </span>
          </h2>

          <p className="mt-4 text-sm text-pretty text-muted-foreground">
            ReelFlow takes an issue and an angle, writes three distinct scripts,
            renders the one you pick as an AI avatar video, and publishes it to
            your channels on a schedule you approve.
          </p>

          {/* Needs roughly 300px of its own; below that the panel reads fine
              without it, so it is dropped rather than squeezed. */}
          <ol className="mt-7 hidden space-y-2 [@media(min-height:760px)]:block">
            {PIPELINE_STAGES.map(({ title, icon: Icon }, index) => (
              <li key={title} className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card/70 text-muted-foreground backdrop-blur-sm">
                  <Icon className="size-4" />
                </span>
                <span className="text-sm font-medium text-foreground/90">
                  {title}
                </span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className="shrink-0 text-xs text-muted-foreground">
        © {new Date().getFullYear()} ReelFlow. All rights reserved.
      </p>
    </div>
  )
}
