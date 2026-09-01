"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Video } from "lucide-react"

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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/approvals" />}
              tooltip="Video Automation"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Video className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">
                  Video Automation
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Campaign pipeline
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
