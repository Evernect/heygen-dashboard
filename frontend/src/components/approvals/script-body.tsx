"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { countSpokenWords } from "@/lib/format"
import { cn } from "@/lib/utils"

const BREAK_PATTERN = /(<break\s+time="[^"]*"\s*\/>)/g

export function ScriptBody({
  value,
  onChange,
  isEditing,
}: {
  value: string
  onChange: (value: string) => void
  isEditing: boolean
}) {
  const wordCount = countSpokenWords(value)
  const isOffTarget = wordCount < 70 || wordCount > 95

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={value}
          rows={8}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs leading-relaxed"
        />
        <WordCount count={wordCount} isOffTarget={isOffTarget} />
      </div>
    )
  }

  const segments = value.split(BREAK_PATTERN).filter(Boolean)

  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-7">
        {segments.map((segment, index) => {
          const match = segment.match(/^<break\s+time="([^"]*)"\s*\/>$/)

          if (match) {
            return (
              <span
                key={index}
                title={`${match[1]} pause`}
                className="mx-1 inline-flex translate-y-[-1px] items-center rounded-full bg-muted px-1.5 font-mono text-[10px] text-muted-foreground ring-1 ring-border"
              >
                {match[1]}
              </span>
            )
          }

          return <span key={index}>{segment}</span>
        })}
      </div>
      <WordCount count={wordCount} isOffTarget={isOffTarget} />
    </div>
  )
}

function WordCount({
  count,
  isOffTarget,
}: {
  count: number
  isOffTarget: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isOffTarget ? "destructive" : "secondary"}
        className="tabular-nums"
      >
        {count} words
      </Badge>
      <span
        className={cn(
          "text-xs",
          isOffTarget ? "text-destructive" : "text-muted-foreground"
        )}
      >
        target 75–90 spoken words (~30s)
      </span>
    </div>
  )
}
