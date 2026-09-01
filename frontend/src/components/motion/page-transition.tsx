"use client"

import { motion, useReducedMotion } from "framer-motion"

import { fadeInUp } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
