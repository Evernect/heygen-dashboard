"use client"

import { useState } from "react"
import Link from "next/link"

import { ReelflowWordmark } from "@/components/landing/reelflow-wordmark"
import { SignOutButton } from "@/components/auth/sign-out-button"
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
import { DEFAULT_SIGNED_IN_ROUTE } from "@/lib/auth/routes"
import type { AuthUser } from "@/lib/auth/user"

const SECTIONS = [
  { name: "How it works", link: "#how-it-works" },
  { name: "Features", link: "#features" },
]

export function LandingNav({ user }: { user: AuthUser | null }) {
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

          {user ? (
            <>
              <LinkButton size="sm" href={DEFAULT_SIGNED_IN_ROUTE}>
                Dashboard
              </LinkButton>
              <SignOutButton size="sm" />
            </>
          ) : (
            <>
              <LinkButton size="sm" variant="ghost" href="/login">
                Sign in
              </LinkButton>
              <LinkButton size="sm" href="/signup">
                Get started
              </LinkButton>
            </>
          )}
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

          {user ? (
            <>
              <LinkButton
                size="lg"
                href={DEFAULT_SIGNED_IN_ROUTE}
                className="mt-2 w-full"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </LinkButton>
              <SignOutButton
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => setIsOpen(false)}
              />
            </>
          ) : (
            <>
              <LinkButton
                size="lg"
                variant="outline"
                href="/login"
                className="mt-2 w-full"
                onClick={() => setIsOpen(false)}
              >
                Sign in
              </LinkButton>
              <LinkButton
                size="lg"
                href="/signup"
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Get started
              </LinkButton>
            </>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
