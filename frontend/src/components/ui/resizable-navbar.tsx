"use client"

import React, { useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion"
import { MenuIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const COLLAPSE_TRANSITION = {
  type: "spring" as const,
  stiffness: 200,
  damping: 50,
}

const COLLAPSED_SHADOW =
  "0 6px 24px oklch(0 0 0 / 0.1), 0 1px 2px oklch(0 0 0 / 0.06)"

interface NavbarProps {
  children: React.ReactNode
  className?: string
}

interface NavBodyProps {
  children: React.ReactNode
  className?: string
  visible?: boolean
}

interface NavItemsProps {
  items: { name: string; link: string }[]
  className?: string
  onItemClick?: () => void
}

interface MobileNavProps {
  children: React.ReactNode
  className?: string
  visible?: boolean
}

interface MobileNavHeaderProps {
  children: React.ReactNode
  className?: string
}

interface MobileNavMenuProps {
  children: React.ReactNode
  className?: string
  isOpen: boolean
  onClose: () => void
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 100)
  })

  return (
    <div
      ref={ref}
      className={cn("fixed inset-x-0 top-0 z-50 w-full pt-3", className)}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ visible?: boolean }>,
              { visible }
            )
          : child
      )}
    </div>
  )
}

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(12px)" : "blur(0px)",
        boxShadow: visible ? COLLAPSED_SHADOW : "none",
        width: visible ? "62%" : "100%",
        y: visible ? 8 : 0,
      }}
      transition={reduceMotion ? { duration: 0 } : COLLAPSE_TRANSITION}
      style={{ minWidth: "720px" }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-6xl flex-row items-center justify-between self-start rounded-full border border-transparent px-4 py-2 lg:flex",
        visible && "border-border bg-background/80",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  return (
    <nav
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center text-sm font-medium lg:flex",
        className
      )}
    >
      {items.map((item, index) => (
        <a
          key={item.link}
          href={item.link}
          onMouseEnter={() => setHovered(index)}
          onClick={onItemClick}
          className="relative rounded-full px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {hovered === index && (
            <motion.span
              layoutId={reduceMotion ? undefined : "nav-item-hover"}
              className="absolute inset-0 rounded-full bg-muted"
            />
          )}
          <span className="relative z-20">{item.name}</span>
        </a>
      ))}
    </nav>
  )
}

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(12px)" : "blur(0px)",
        boxShadow: visible ? COLLAPSED_SHADOW : "none",
        width: visible ? "92%" : "100%",
        borderRadius: visible ? "1rem" : "2rem",
        y: visible ? 8 : 0,
      }}
      transition={reduceMotion ? { duration: 0 } : COLLAPSE_TRANSITION}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col items-center justify-between border border-transparent px-3 py-2 lg:hidden",
        visible && "border-border bg-background/80",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className
      )}
    >
      {children}
    </div>
  )
}

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "absolute inset-x-0 top-16 z-50 flex w-full flex-col items-start justify-start gap-1 rounded-xl border border-border bg-popover p-4 shadow-lg",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean
  onClick: () => void
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
    >
      {isOpen ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
    </button>
  )
}
