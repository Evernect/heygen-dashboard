"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { PLATFORM_META, isPublishable } from "@/lib/constants/platforms"
import { PLATFORMS, type Platform } from "@/lib/types/platform"
import { cn } from "@/lib/utils"


export function PlatformSelector({
  value,
  onChange,
  disabled,
}: {
  value: Platform[]
  onChange: (value: Platform[]) => void
  disabled?: boolean
}) {
  function toggle(platform: Platform, checked: boolean) {
    onChange(
      checked
        ? [...value, platform]
        : value.filter((entry) => entry !== platform)
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PLATFORMS.map((platform) => {
        const meta = PLATFORM_META[platform]
        const checked = value.includes(platform)
        const supported = isPublishable(platform)

        return (
          <Label
            key={platform}
            className={cn(
              "group/field flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-colors",
              checked ? "border-primary/40 bg-muted/60" : "hover:bg-muted/40",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(next) => toggle(platform, next === true)}
            />
            <span
              className={cn("size-1.5 shrink-0 rounded-full", meta.dotClassName)}
            />
            <span className="flex-1 text-sm font-normal">{meta.label}</span>
            {!supported && (
              <span className="text-xs text-muted-foreground">
                not wired up
              </span>
            )}
          </Label>
        )
      })}
    </div>
  )
}
