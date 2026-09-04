"use client"

import * as React from "react"
import { Clapperboard, Eye, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { stripSsml } from "@/lib/format"
import { groupScriptsByTopic, type Script } from "@/lib/types/script"
import { cn } from "@/lib/utils"

const OPTION_LETTERS = ["A", "B", "C", "D", "E"]

export function ScriptOptionsGrid({
  scripts,
  renderingId,
  onOpen,
  onRender,
}: {
  scripts: Script[]
  renderingId: string | null
  onOpen: (script: Script) => void
  onRender: (script: Script) => void
}) {
  const groups = React.useMemo(() => groupScriptsByTopic(scripts), [scripts])

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.topicId} className="space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">{group.issue}</h3>
            {group.angle && (
              <p className="text-xs text-muted-foreground">{group.angle}</p>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {group.options.map((script, index) => (
              <OptionCard
                key={script.id}
                script={script}
                letter={OPTION_LETTERS[index] ?? String(index + 1)}
                isRendering={renderingId === script.id}
                isDisabled={renderingId !== null && renderingId !== script.id}
                onOpen={() => onOpen(script)}
                onRender={() => onRender(script)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function OptionCard({
  script,
  letter,
  isRendering,
  isDisabled,
  onOpen,
  onRender,
}: {
  script: Script
  letter: string
  isRendering: boolean
  isDisabled: boolean
  onOpen: () => void
  onRender: () => void
}) {
  const spoken = stripSsml(script.scriptText)

  return (
    <Card
      className={cn(
        "flex flex-col transition-colors",
        isRendering && "ring-2 ring-status-processing/40",
        isDisabled && "opacity-60"
      )}
    >
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {letter}
          </Badge>
          {script.variantLabel && (
            <span className="text-xs text-muted-foreground">
              {script.variantLabel}
            </span>
          )}
        </div>
        <CardTitle className="text-sm">{script.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
          {spoken}
        </p>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={onOpen}
          disabled={isDisabled}
        >
          <Eye />
          Read
        </Button>
        <Button
          variant="brand"
          size="sm"
          className="flex-1"
          onClick={onRender}
          disabled={isRendering || isDisabled}
        >
          {isRendering ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Clapperboard />
          )}
          {isRendering ? "Starting" : "Use this"}
        </Button>
      </CardFooter>
    </Card>
  )
}
