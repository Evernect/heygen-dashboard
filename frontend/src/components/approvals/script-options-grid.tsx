"use client"

import * as React from "react"
import { Ban, Check, Clapperboard, Eye, Loader2, Sparkles } from "lucide-react"

import { ScriptStatusBadge } from "@/components/shared/status-badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatRelative, stripSsml } from "@/lib/format"
import {
  groupScriptsByTopic,
  type Script,
  type ScriptOptionGroup,
} from "@/lib/types/script"
import { cn } from "@/lib/utils"

const OPTION_LETTERS = ["A", "B", "C", "D", "E"]

const CHOSEN_TINT =
  "border-[color-mix(in_oklch,var(--brand-blue),transparent_60%)] bg-[color-mix(in_oklch,var(--brand-blue),var(--background)_88%)] text-[var(--brand-blue-dark)] dark:bg-[color-mix(in_oklch,var(--brand-blue),transparent_84%)] dark:text-[var(--brand-blue)]"

/** Same box as a `size="sm"` button, so the footer slots line up. */
const FOOTER_PILL =
  "flex h-7 flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[0.8rem] font-medium [&_svg]:size-3.5 [&_svg]:shrink-0"

function letterFor(index: number) {
  return OPTION_LETTERS[index] ?? String(index + 1)
}

function chosenIndexOf(group: ScriptOptionGroup) {
  return group.chosen
    ? group.options.findIndex((option) => option.id === group.chosen?.id)
    : -1
}

interface OptionActions {
  renderingId: string | null
  onOpen: (script: Script) => void
  onRender: (script: Script) => void
}

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

  const [latest, ...earlier] = groups
  if (!latest) return null

  const actions = { renderingId, onOpen, onRender }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">{latest.issue}</h3>
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles />
                Latest
              </Badge>
            </div>
            {latest.angle && (
              <p className="text-xs text-muted-foreground">{latest.angle}</p>
            )}
          </div>
          <GroupStatus group={latest} />
        </div>

        <OptionCards group={latest} {...actions} />
      </section>

      {earlier.length > 0 && (
        <section className="space-y-1">
          <h4 className="text-xs font-medium text-muted-foreground">
            Earlier topics ({earlier.length})
          </h4>

          <Accordion multiple className="rounded-xl ring-1 ring-foreground/10">
            {earlier.map((group) => (
              <AccordionItem
                key={group.topicId}
                value={group.topicId}
                className="not-last:border-b"
              >
                {/* Padding lives on the trigger/panel, not the item: the panel
                    clips at its own edge and would shave the chosen card's ring. */}
                <AccordionTrigger className="gap-4 px-4 py-3 hover:no-underline">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium">
                        {group.issue}
                      </p>
                      <p className="text-xs font-normal text-muted-foreground">
                        {group.options.length} options ·{" "}
                        {formatRelative(group.createdAt)}
                      </p>
                    </div>
                    <GroupStatus group={group} />
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  {group.angle && (
                    <p className="mb-3 text-xs text-muted-foreground">
                      {group.angle}
                    </p>
                  )}
                  <OptionCards group={group} {...actions} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}
    </div>
  )
}

function GroupStatus({ group }: { group: ScriptOptionGroup }) {
  if (!group.chosen) return null

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Badge variant="outline" className={cn("gap-1.5 ring-inset", CHOSEN_TINT)}>
        <Check />
        Option {letterFor(chosenIndexOf(group))} chosen
      </Badge>
      <ScriptStatusBadge status={group.chosen.status} />
    </div>
  )
}

function OptionCards({
  group,
  renderingId,
  onOpen,
  onRender,
}: { group: ScriptOptionGroup } & OptionActions) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {group.options.map((script, index) => (
        <OptionCard
          key={script.id}
          script={script}
          letter={letterFor(index)}
          isChosen={script.id === group.chosen?.id}
          hasChosenSibling={
            group.chosen !== null && script.id !== group.chosen.id
          }
          isRendering={renderingId === script.id}
          isDisabled={renderingId !== null && renderingId !== script.id}
          onOpen={() => onOpen(script)}
          onRender={() => onRender(script)}
        />
      ))}
    </div>
  )
}

function OptionCard({
  script,
  letter,
  isChosen,
  hasChosenSibling,
  isRendering,
  isDisabled,
  onOpen,
  onRender,
}: {
  script: Script
  letter: string
  isChosen: boolean
  hasChosenSibling: boolean
  isRendering: boolean
  isDisabled: boolean
  onOpen: () => void
  onRender: () => void
}) {
  const spoken = stripSsml(script.scriptText)
  const isRejected = script.status === "REJECTED"

  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all",
        isChosen &&
          "shadow-lg shadow-[color-mix(in_oklch,var(--brand-blue),transparent_86%)] ring-2 ring-[color-mix(in_oklch,var(--brand-blue),transparent_55%)]",
        hasChosenSibling && !isRejected && "opacity-70 hover:opacity-100",
        isRejected && "opacity-60",
        isRendering && "ring-2 ring-status-processing/40",
        isDisabled && "opacity-60"
      )}
    >
      {isChosen && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-pink))]"
        />
      )}

      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={isChosen ? "outline" : "secondary"}
            className={cn(
              "size-5 justify-center p-0 font-mono leading-none",
              isChosen && cn("ring-inset", CHOSEN_TINT)
            )}
          >
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

      <CardContent className="flex-1">
        <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
          {spoken}
        </p>
      </CardContent>

      <CardFooter className="items-center justify-center gap-2">
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

        {isChosen ? (
          <span className={cn(FOOTER_PILL, CHOSEN_TINT)}>
            <Check />
            Chosen
          </span>
        ) : isRejected ? (
          <span
            className={cn(
              FOOTER_PILL,
              "border-border bg-muted text-muted-foreground"
            )}
          >
            <Ban />
            Disapproved
          </span>
        ) : (
          <Button
            variant={hasChosenSibling ? "outline" : "brand"}
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
            {isRendering
              ? "Starting"
              : hasChosenSibling
                ? "Use instead"
                : "Use this"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
