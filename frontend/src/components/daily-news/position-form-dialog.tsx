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
import { createPosition } from "@/lib/api/news-config"

const BLANK = {
  issue: "",
  stance: "",
  sourceUrl: "",
}

export function PositionFormDialog({
  open,
  onOpenChange,
  sortOrder,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sortOrder: number
  onSaved: () => void
}) {
  const { notifySuccess, notifyError } = useToastFeedback()

  const [form, setForm] = React.useState(BLANK)
  const [isSaving, setIsSaving] = React.useState(false)

  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setForm(BLANK)
  }

  function patch(partial: Partial<typeof BLANK>) {
    setForm((current) => ({ ...current, ...partial }))
  }

  const canSubmit =
    form.issue.trim().length > 0 && form.stance.trim().length > 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit || isSaving) return

    setIsSaving(true)
    try {
      await createPosition({
        issue: form.issue.trim(),
        stance: form.stance.trim(),
        sourceUrl: form.sourceUrl.trim() || null,
        sortOrder,
      })

      notifySuccess("Position added")
      onOpenChange(false)
      onSaved()
    } catch (caught) {
      notifyError("Could not add this position", caught)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>New position</DialogTitle>
            <DialogDescription>
              What the candidate has already said. The selector prefers
              stories that touch this, and the angle writer is told never to
              contradict it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="position-issue">Issue</Label>
              <Input
                id="position-issue"
                value={form.issue}
                onChange={(event) => patch({ issue: event.target.value })}
                placeholder="Gas tax"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position-source">Source (optional)</Label>
              <Input
                id="position-source"
                type="url"
                value={form.sourceUrl}
                onChange={(event) => patch({ sourceUrl: event.target.value })}
                placeholder="https://example.com/positions"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position-stance">Position</Label>
            <Textarea
              id="position-stance"
              rows={3}
              value={form.stance}
              onChange={(event) => patch({ stance: event.target.value })}
              placeholder="Opposes gas tax increases and the proposed mileage tax; wants to cut the state gas tax."
            />
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
              Add position
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
