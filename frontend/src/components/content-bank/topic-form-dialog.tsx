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
import { createTopic, updateTopic } from "@/lib/api/topics"
import type { Topic } from "@/lib/types/topic"

export function TopicFormDialog({
  open,
  onOpenChange,
  topic,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  topic?: Topic | null
  onSaved: () => void
}) {
  const isEditing = Boolean(topic)
  const { notifySuccess, notifyError } = useToastFeedback()

  const [issue, setIssue] = React.useState("")
  const [angle, setAngle] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)

  const seedKey = open ? (topic?.id ?? "new") : null
  const [lastSeedKey, setLastSeedKey] = React.useState(seedKey)
  if (seedKey !== lastSeedKey) {
    setLastSeedKey(seedKey)
    if (seedKey !== null) {
      setIssue(topic?.issue ?? "")
      setAngle(topic?.angle ?? "")
    }
  }

  const canSubmit = issue.trim().length >= 3 && angle.trim().length >= 3

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || isSaving) return

    setIsSaving(true)
    try {
      const payload = { issue: issue.trim(), angle: angle.trim() }

      if (topic) {
        await updateTopic(topic.id, payload)
        notifySuccess("Topic updated")
      } else {
        await createTopic(payload)
        notifySuccess("Topic added to the content bank")
      }

      onOpenChange(false)
      onSaved()
    } catch (error) {
      notifyError(
        isEditing ? "Could not update topic" : "Could not add topic",
        error
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit topic" : "New topic"}</DialogTitle>
            <DialogDescription>
              The issue sets what the video is about; the angle sets the
              position the speaker takes on it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="topic-issue">Issue</Label>
            <Input
              id="topic-issue"
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
              placeholder="Rising utility costs in the district"
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="topic-angle">Angle</Label>
            <Textarea
              id="topic-angle"
              value={angle}
              onChange={(event) => setAngle(event.target.value)}
              placeholder="I want an independent audit before any further rate increase is approved."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Only facts stated here reach the script — the model is instructed
              never to invent details.
            </p>
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
              {isEditing ? "Save changes" : "Add topic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
