import { cn } from "@/lib/utils"

export function ReelflowWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span className="flex aspect-square size-7 items-center justify-center rounded-lg bg-[image:var(--brand-gradient-text)] shadow-sm">
        <span className="-translate-x-[0.09em] text-xs leading-none font-extrabold text-white italic">
          RF
        </span>
      </span>
      <span className="text-lg font-extrabold tracking-tight text-foreground">
        Reel
        <span className="bg-[image:var(--brand-gradient-text)] bg-clip-text pr-0.5 text-transparent italic">
          Flow
        </span>
      </span>
    </span>
  )
}
