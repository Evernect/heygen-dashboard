"use client"

import * as React from "react"
import { animate, useReducedMotion } from "framer-motion"

import { EASE_OUT } from "@/lib/motion"
import { formatCompactNumber, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AnimatedNumber({
  value,
  compact = false,
  className,
}: {
  value: number
  compact?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const [animated, setAnimated] = React.useState(0)
  const format = compact ? formatCompactNumber : formatNumber

  React.useEffect(() => {
    if (reduceMotion) return

    const controls = animate(0, value, {
      duration: 0.7,
      ease: EASE_OUT,
      onUpdate: (latest) => setAnimated(Math.round(latest)),
    })

    return () => controls.stop()
  }, [value, reduceMotion])

  const shown = reduceMotion ? value : animated

  return <span className={cn("tabular-nums", className)}>{format(shown)}</span>
}
