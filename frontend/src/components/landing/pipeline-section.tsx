import { Timeline } from "@/components/ui/timeline"
import { PIPELINE_STAGES } from "@/lib/constants/landing"

export function PipelineSection() {
  const entries = PIPELINE_STAGES.map(({ title, icon: Icon, body, points }) => ({
    title,
    content: (
      <div key={title} className="max-w-xl">
        <span className="mb-4 flex size-9 items-center justify-center rounded-lg bg-[image:var(--brand-icon-gradient)] text-[var(--brand-blue-dark)] shadow-sm">
          <Icon className="size-4.5" />
        </span>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground md:text-base">
          {body}
        </p>
        <ul className="mt-5 space-y-2">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 text-sm text-foreground/80"
            >
              <span
                aria-hidden
                className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-[var(--brand-blue)]"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  }))

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 pt-20 md:px-6 md:pt-28">
        <p className="text-sm font-semibold text-[var(--brand-blue-dark)] dark:text-[var(--brand-blue)]">
          How it works
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-balance md:text-4xl">
          Six stages between an idea and a published reel
        </h2>
        <p className="mt-4 max-w-2xl text-base text-pretty text-muted-foreground">
          The whole pipeline runs on its own except for the one step that should
          never be automated: the moment you decide a video is good enough to
          post.
        </p>
      </div>

      <Timeline data={entries} />
    </section>
  )
}
