"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Clapperboard } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NAV_ITEMS } from "@/lib/constants/navigation"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[collapsible=icon]:pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/approvals" />}
              tooltip="ReelFlow"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[image:var(--brand-gradient)] text-primary-foreground shadow-sm">
                <Clapperboard className="size-4" />
              </div>
              <span className="truncate pr-1 text-xl font-extrabold tracking-tight text-foreground">
                Reel
                <span className="bg-[image:var(--brand-gradient-text)] bg-clip-text pr-0.5 italic text-transparent">
                  Flow
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:mt-2">
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <SidebarMenuItem key={item.href} className="relative">
                    {/* Shared layoutId slides the highlight between items
                        instead of cross-fading two separate backgrounds. */}
                    {isActive && !reduceMotion && (
                      <motion.span
                        layoutId="sidebar-active-item"
                        className="absolute inset-0 rounded-lg bg-sidebar-accent"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                      className={cn(
                        "relative z-10",
                        isActive && !reduceMotion && "bg-transparent!"
                      )}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          Scheduling runs every minute
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
