"use client"

import { useTheme } from "next-themes"
import { MonitorIcon, MoonIcon, Palette, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useIsHydrated } from "@/hooks/use-is-hydrated"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const

export function ThemePreference() {
  const { theme, setTheme } = useTheme()
  const isHydrated = useIsHydrated()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-4" />
          Appearance
        </CardTitle>
        <CardDescription>Applies to this browser only.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => setTheme(value)}
              className={cn(
                isHydrated &&
                  theme === value &&
                  "border-primary/40 bg-muted font-medium"
              )}
            >
              <Icon />
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
