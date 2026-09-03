"use client"

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"

import { staggerContainer, staggerItem } from "@/lib/motion"

type MotionProps<T extends keyof HTMLElementTagNameMap> = Omit<
  HTMLMotionProps<T>,
  "children"
> & { children?: React.ReactNode }

export function AnimatedList({
  children,
  className,
  ...props
}: MotionProps<"div">) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({
  children,
  className,
  ...props
}: MotionProps<"div">) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  )
}

export function AnimatedTableBody({
  children,
  className,
  ...props
}: MotionProps<"tbody">) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <tbody className={className}>{children}</tbody>
  }

  return (
    <motion.tbody
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
      {...props}
    >
      {children}
    </motion.tbody>
  )
}

export function AnimatedTableRow({
  children,
  className,
  ...props
}: MotionProps<"tr">) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <tr className={className}>{children}</tr>
  }

  return (
    <motion.tr variants={staggerItem} className={className} {...props}>
      {children}
    </motion.tr>
  )
}
