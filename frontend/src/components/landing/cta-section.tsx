import { ArrowRightIcon } from "lucide-react"

import { LinkButton } from "@/components/shared/link-button"

export function CtaSection() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-24">
        <div className="relative overflow-hidden rounded-2xl bg-[image:var(--brand-gradient)] px-6 py-14 text-center md:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,oklch(1_0_0/0.14)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.14)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]"
          />

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-balance text-[#04212b] md:text-4xl">
              Your next reel is one topic away
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-pretty text-[#04212b]/75">
              Open the board, generate scripts from a topic, and approve the take
              you like. ReelFlow handles the render, the captions and the post.
            </p>
            <LinkButton
              size="lg"
              href="/approvals"
              className="mt-8 h-11 rounded-xl bg-[#04212b] px-6 text-white hover:bg-[#04212b]/85"
            >
              Open dashboard
              <ArrowRightIcon data-icon="inline-end" />
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  )
}
