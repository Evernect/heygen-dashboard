import { cn } from "@/lib/utils"

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-6xl grid-cols-1 gap-4 md:auto-rows-[minmax(13rem,auto)] md:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  )
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  header?: React.ReactNode
  icon?: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_oklch,var(--brand-blue),transparent_60%)] hover:shadow-lg",
        className
      )}
    >
      {header}
      <div>
        {icon}
        <div className="mt-3 mb-1.5 font-sans text-base font-semibold tracking-tight text-foreground">
          {title}
        </div>
        <div className="font-sans text-sm leading-relaxed font-normal text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  )
}
