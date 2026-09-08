"use client"

import { useState } from "react"
import Link from "next/link"

import { ReelflowWordmark } from "@/components/landing/reelflow-wordmark"
import { LinkButton } from "@/components/shared/link-button"
import { ModeToggle } from "@/components/theme/mode-toggle"
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  Navbar,
  NavBody,
  NavItems,
} from "@/components/ui/resizable-navbar"

const SECTIONS = [
  { name: "How it works", link: "#how-it-works" },
  { name: "Features", link: "#features" },
]

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Navbar>
      <NavBody>
        <Link href="/" aria-label="ReelFlow home" className="relative z-20">
          <ReelflowWordmark />
        </Link>

        <NavItems items={SECTIONS} />

        <div className="relative z-20 flex items-center gap-2">
          <ModeToggle />
          <LinkButton size="sm" href="/approvals">
            Open dashboard
          </LinkButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <Link href="/" aria-label="ReelFlow home">
            <ReelflowWordmark />
          </Link>

          <div className="flex items-center gap-1">
            <ModeToggle />
            <MobileNavToggle
              isOpen={isOpen}
              onClick={() => setIsOpen((open) => !open)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {SECTIONS.map((section) => (
            <a
              key={section.link}
              href={section.link}
              onClick={() => setIsOpen(false)}
              className="w-full rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {section.name}
            </a>
          ))}

          <LinkButton
            size="lg"
            href="/approvals"
            className="mt-2 w-full"
            onClick={() => setIsOpen(false)}
          >
            Open dashboard
          </LinkButton>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
