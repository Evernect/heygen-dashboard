"use client"

import { motion } from "framer-motion"
import { ArrowRightIcon, SparklesIcon } from "lucide-react"

import { LinkButton } from "@/components/shared/link-button"
import { Button } from "@/components/ui/button"
import { Spotlight } from "@/components/ui/spotlight-new"
import { staggerContainer, staggerItem } from "@/lib/motion"

const FLOW = [
  "Topic",
  "3 scripts",
  "Avatar video",
  "Your approval",
  "Scheduled",
  "Published",
]

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <Spotlight />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 [background-image:linear-gradient(to_right,var(--grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-line)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_35%,black,transparent)]"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 pb-20 text-center md:px-6 md:pt-28 md:pb-28"
      >
        <motion.span
          variants={staggerItem}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--brand-blue),transparent_65%)] bg-[color-mix(in_oklch,var(--brand-blue),var(--background)_92%)] px-3 py-1 text-xs font-medium text-[var(--brand-blue-dark)] dark:text-[var(--brand-blue)]"
        >
          <SparklesIcon className="size-3.5" />
          AI script → avatar video → auto-publish
        </motion.span>

        <motion.h1
          variants={staggerItem}
          className="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl"
        >
          One topic in.
          <br />
          <span className="bg-[image:var(--brand-gradient-text)] bg-clip-text pr-1 text-transparent">
            Published reels out.
          </span>
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-6 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg"
        >
          ReelFlow takes an issue and an angle, writes three distinct scripts,
          renders the one you pick as an AI avatar video, and publishes it to
          your channels on a schedule you approve.
        </motion.p>

        <motion.div
          variants={staggerItem}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <LinkButton
            size="lg"
            href="/approvals"
            className="h-11 rounded-xl px-6"
          >
            Open dashboard
            <ArrowRightIcon data-icon="inline-end" />
          </LinkButton>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<a href="#how-it-works" />}
            className="h-11 rounded-xl px-6"
          >
            See how it works
          </Button>
        </motion.div>

        <motion.ul
          variants={staggerItem}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-3"
        >
          {FLOW.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-lg border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                {step}
              </span>
              {index < FLOW.length - 1 && (
                <ArrowRightIcon
                  aria-hidden
                  className="size-3 shrink-0 text-muted-foreground/50"
                />
              )}
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  )
}
