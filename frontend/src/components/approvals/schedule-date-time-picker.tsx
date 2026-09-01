"use client"

import * as React from "react"
import { CalendarClock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useNow } from "@/hooks/use-now"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

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

  // Time lives as a string so a half-typed "1" doesn't reset the date.
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
              // Nothing can be scheduled into the past.
              disabled={{ before: earliestDay }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="schedule-time">Time</Label>
        <Input
          id="schedule-time"
          type="time"
          value={time}
          disabled={disabled}
          onChange={(event) => handleTimeChange(event.target.value)}
          className="w-full sm:w-32"
        />
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
