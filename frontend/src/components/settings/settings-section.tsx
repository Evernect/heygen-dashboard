"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  description: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Icon className="size-4.5" />
          </span>
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-(--card-spacing)">{children}</CardContent>
    </Card>
  )
}

export function SettingsGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-6",
        className
      )}
    >
      {children}
    </div>
  )
}
