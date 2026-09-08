"use client"

import { motion, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

type SpotlightProps = {
  className?: string
  gradientFirst?: string
  gradientSecond?: string
  gradientThird?: string
  translateY?: number
  width?: number
  height?: number
  smallWidth?: number
  duration?: number
  xOffset?: number
}

export const Spotlight = ({
  className,
  gradientFirst = "var(--spotlight-first)",
  gradientSecond = "var(--spotlight-second)",
  gradientThird = "var(--spotlight-third)",
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}: SpotlightProps = {}) => {
  const reduceMotion = useReducedMotion()

  const drift = (offset: number) =>
    reduceMotion
      ? undefined
      : {
          x: [0, offset, 0],
        }

  const driftTransition = {
    duration,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 1.5 }}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-0 h-full w-full",
        className
      )}
    >
      <motion.div
        animate={drift(xOffset)}
        transition={driftTransition}
        className="pointer-events-none absolute top-0 left-0 h-full w-full"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(-45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0"
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 origin-top-left"
        />

        <div
          style={{
            transform: "rotate(-45deg) translate(-180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 left-0 origin-top-left"
        />
      </motion.div>

      <motion.div
        animate={drift(-xOffset)}
        transition={driftTransition}
        className="pointer-events-none absolute top-0 right-0 h-full w-full"
      >
        <div
          style={{
            transform: `translateY(${translateY}px) rotate(45deg)`,
            background: gradientFirst,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0"
        />

        <div
          style={{
            transform: "rotate(45deg) translate(-5%, -50%)",
            background: gradientSecond,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 origin-top-right"
        />

        <div
          style={{
            transform: "rotate(45deg) translate(180%, -70%)",
            background: gradientThird,
            width: `${smallWidth}px`,
            height: `${height}px`,
          }}
          className="absolute top-0 right-0 origin-top-right"
        />
      </motion.div>
    </motion.div>
  )
}
