"use client"

import * as React from "react"
import { CalendarClock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNow } from "@/hooks/use-now"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0")
)
const PERIODS = ["AM", "PM"] as const

export function ScheduleDateTimePicker({
  value,
  onChange,
  disabled,
}: {
  value: Date | null
  onChange: (value: Date | null) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const now = useNow()

  const [time, setTime] = React.useState(() =>
    value ? toTimeString(value) : "09:00"
  )

  function handleDateSelect(date: Date | undefined) {
    if (!date) {
      onChange(null)
      return
    }
    onChange(combine(date, time))
    setOpen(false)
  }

  function handleTimeChange(nextTime: string) {
    setTime(nextTime)
    if (value && nextTime) onChange(combine(value, nextTime))
  }

  const { hour, minute, period } = to12Hour(time)

  function handlePartChange(
    part: "hour" | "minute" | "period",
    next: string | null
  ) {
    if (!next) return
    handleTimeChange(
      to24Hour(
        part === "hour" ? next : hour,
        part === "minute" ? next : minute,
        part === "period" ? (next as "AM" | "PM") : period
      )
    )
  }

  const isPast = value ? value.getTime() <= now : false
  const earliestDay = startOfDay(now)

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <div className="grid gap-2">
        <Label htmlFor="schedule-date">Date</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                id="schedule-date"
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start font-normal",
                  !value && "text-muted-foreground"
                )}
              />
            }
          >
            <CalendarClock />
            {value ? formatDate(value) : "Pick a date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ?? undefined}
              onSelect={handleDateSelect}
              disabled={{ before: earliestDay }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="schedule-time-hour">Time</Label>
        <div id="schedule-time-hour" className="flex items-center gap-1.5">
          <Select
            value={hour}
            onValueChange={(next) => handlePartChange("hour", next)}
            disabled={disabled}
          >
            <SelectTrigger className="w-16" aria-label="Hour">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select
            value={minute}
            onValueChange={(next) => handlePartChange("minute", next)}
            disabled={disabled}
          >
            <SelectTrigger className="w-16" aria-label="Minute">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              {MINUTES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={period}
            onValueChange={(next) => handlePartChange("period", next)}
            disabled={disabled}
          >
            <SelectTrigger className="w-17" aria-label="AM or PM">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPast && (
        <p className="text-xs text-destructive sm:col-span-2">
          That time has already passed — pick a future slot.
        </p>
      )}
    </div>
  )
}

function toTimeString(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`
}

function combine(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const next = new Date(date)
  next.setHours(hours || 0, minutes || 0, 0, 0)
  return next
}

function startOfDay(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date
}

function to12Hour(time: string) {
  const [hours24, minutes] = time.split(":").map(Number)
  const period = hours24 >= 12 ? "PM" : "AM"
  const hour12 = hours24 % 12 || 12
  const roundedMinute = Math.round((minutes || 0) / 5) * 5
  return {
    hour: String(hour12).padStart(2, "0"),
    minute: String(roundedMinute % 60).padStart(2, "0"),
    period,
  } as const
}

function to24Hour(hour12: string, minute: string, period: "AM" | "PM") {
  let hours24 = Number(hour12) % 12
  if (period === "PM") hours24 += 12
  return `${String(hours24).padStart(2, "0")}:${minute}`
}
