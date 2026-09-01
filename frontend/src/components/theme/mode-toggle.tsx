"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { cn } from "@/lib/utils"

const THEMES = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const isHydrated = useIsHydrated()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            className="relative"
          />
        }
      >
        <SunIcon className="size-4 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
        <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </span>
            <CheckIcon
              className={cn(
                "size-3.5",
                isHydrated && theme === value ? "opacity-100" : "opacity-0"
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
