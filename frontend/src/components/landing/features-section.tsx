import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { LANDING_FEATURES } from "@/lib/constants/landing"

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-border/60 bg-muted/40"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
        <p className="text-sm font-semibold text-[var(--brand-blue-dark)] dark:text-[var(--brand-blue)]">
          What you get
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-balance md:text-4xl">
          Built for a channel you actually have to keep feeding
        </h2>
        <p className="mt-4 max-w-2xl text-base text-pretty text-muted-foreground">
          Facebook and Instagram publish today. YouTube, TikTok and X get
          captions written for them and are recorded as pending until their
          publishing is wired up.
        </p>

        <BentoGrid className="mt-12">
          {LANDING_FEATURES.map(
            ({ title, description, icon: Icon, className }) => (
              <BentoGridItem
                key={title}
                title={title}
                description={description}
                className={className}
                icon={
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[image:var(--brand-icon-gradient)] text-[var(--brand-blue-dark)] shadow-sm">
                    <Icon className="size-4.5" />
                  </span>
                }
              />
            )
          )}
        </BentoGrid>
      </div>
    </section>
  )
}
