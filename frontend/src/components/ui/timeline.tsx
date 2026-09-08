"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"

import { cn } from "@/lib/utils"

export interface TimelineEntry {
  title: string
  content: React.ReactNode
}

export const Timeline = ({
  data,
  className,
}: {
  data: TimelineEntry[]
  className?: string
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => setHeight(el.getBoundingClientRect().height)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  })

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height])
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1])

  return (
    <div className={cn("w-full font-sans", className)} ref={containerRef}>
      <div
        ref={ref}
        className="relative mx-auto max-w-6xl px-4 pb-16 md:px-6"
      >
        {data.map((item, index) => (
          <div
            key={item.title}
            className="flex justify-start pt-10 md:gap-10 md:pt-28"
          >
            <div className="sticky top-28 z-10 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
              <div className="absolute left-4 flex size-10 items-center justify-center rounded-full border border-border bg-card shadow-sm md:left-6">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="hidden text-balance text-2xl font-bold tracking-tight text-foreground md:block md:pl-20 lg:text-3xl">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pl-16 md:pl-4">
              <h3 className="mb-3 block text-left text-xl font-bold tracking-tight text-foreground md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        <div
          style={{ height: `${height}px` }}
          className="absolute top-0 left-[35px] w-[2px] overflow-hidden md:left-[43px] bg-gradient-to-b from-transparent via-border to-transparent from-[0%] to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={
              reduceMotion
                ? { height: "100%", opacity: 1 }
                : { height: heightTransform, opacity: opacityTransform }
            }
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-[var(--brand-pink)] via-[var(--brand-blue)] to-transparent from-[0%] via-[12%]"
          />
        </div>
      </div>
    </div>
  )
}
