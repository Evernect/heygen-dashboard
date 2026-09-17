"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { updateDailyNewsItem } from "@/lib/api/daily-news"
import type { DailyNewsItem } from "@/lib/types/daily-news"

export function NewsItemEditDialog({
  item,
  onOpenChange,
  onSaved,
}: {
  item: DailyNewsItem | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const { notifySuccess, notifyError } = useToastFeedback()

  const [topic, setTopic] = React.useState("")
  const [angle, setAngle] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  const seedKey = item?.id ?? null
  const [lastSeedKey, setLastSeedKey] = React.useState(seedKey)
  if (seedKey !== lastSeedKey) {
    setLastSeedKey(seedKey)
    setTopic(item?.topic ?? "")
    setAngle(item?.angle ?? "")
  }

  const canSubmit = topic.trim().length >= 3 && angle.trim().length >= 3

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!item || !canSubmit || isSaving) return

    setIsSaving(true)
    try {
      await updateDailyNewsItem(item.id, {
        topic: topic.trim(),
        angle: angle.trim(),
      })
      notifySuccess("News item updated")
      onOpenChange(false)
      onSaved()
    } catch (caught) {
      notifyError("Could not update this item", caught)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit news topic</DialogTitle>
            <DialogDescription>
              Only what is written here reaches the script. Keep it to facts
              that appear in the reporting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="news-topic">Topic</Label>
            <Input
              id="news-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="news-angle">Angle</Label>
            <Textarea
              id="news-angle"
              value={angle}
              onChange={(event) => setAngle(event.target.value)}
              rows={4}
              placeholder="I would repeal the increase rather than index it to inflation."
            />
            {item?.headlinesOnly && (
              <p className="text-xs text-muted-foreground">
                No article text was readable for this story, so keep the angle
                general — do not add detail beyond the headline.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
