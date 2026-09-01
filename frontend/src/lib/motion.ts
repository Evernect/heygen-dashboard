import type { Transition, Variants } from "framer-motion"

// Standard "ease-out expo"-ish curve: fast start, gentle settle
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const DURATION = {
  fast: 0.18,
  base: 0.24,
  slow: 0.32,
} as const

export const transition: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT,
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE_OUT } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
}

// Parent wrapper that cascades its children's entrance
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
  exit: { opacity: 1 },
}

// Row-level variant used inside a staggerContainer (tables, card grids)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
}
