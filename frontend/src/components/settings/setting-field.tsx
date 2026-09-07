"use client"

import * as React from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function SettingField({
  label,
  description,
  htmlFor,
  control,
  className,
  children,
}: {
  label: string
  description?: React.ReactNode
  htmlFor?: string
  control?: React.ReactNode
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {control}
      </div>
      {children}
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

export function SliderField({
  id,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  format = (n: number) => String(n),
}: {
  id: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  format?: (value: number) => string
}) {
  return (
    <div className="flex min-h-9 items-center gap-3">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="min-w-14 shrink-0 rounded-md bg-muted px-2 py-1 text-center font-mono text-xs tabular-nums text-foreground/80">
        {format(value)}
      </span>
    </div>
  )
}
