"use client"

import { usePathname } from "next/navigation"

import { ModeToggle } from "@/components/theme/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { findNavItem } from "@/lib/constants/navigation"

export function AppHeader() {
  const pathname = usePathname()
  const current = findNavItem(pathname)

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <span className="text-sm font-medium">{current?.title ?? "Overview"}</span>
      <div className="ml-auto flex items-center gap-1">
        <ModeToggle />
      </div>
    </header>
  )
}
