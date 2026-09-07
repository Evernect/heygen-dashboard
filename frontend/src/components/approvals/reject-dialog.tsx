"use client"

import * as React from "react"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { rejectScript } from "@/lib/api/scripts"
import type { Script } from "@/lib/types/script"

export function RejectDialog({
  script,
  open,
  onOpenChange,
  onRejected,
}: {
  script: Script | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRejected: () => void
}) {
  const { notifySuccess, notifyError } = useToastFeedback()
  const [reason, setReason] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)

  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setReason("")
  }

  async function handleConfirm() {
    if (!script || reason.trim().length === 0) return

    setIsPending(true)
    try {
      await rejectScript(script.id, { reason: reason.trim() })
      notifySuccess("Script disapproved")
      onOpenChange(false)
      onRejected()
    } catch (error) {
      notifyError("Could not disapprove script", error)
    } finally {
      setIsPending(false)
    }
  }

  const hasVideo = Boolean(script?.videoStorageUrl)

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={hasVideo ? "Disapprove this video?" : "Disapprove this script?"}
      description={
        hasVideo
          ? "It won't be uploaded anywhere. The topic's other scripts stay available, so you can pick a different one and render it instead."
          : "It won't be rendered or uploaded. The topic's other scripts stay available to pick from."
      }
      confirmLabel="Disapprove"
      destructive
      isPending={isPending}
      confirmDisabled={reason.trim().length === 0}
      onConfirm={handleConfirm}
    >
      <div className="grid gap-2">
        <Label htmlFor="reject-reason">Reason</Label>
        <Textarea
          id="reject-reason"
          value={reason}
          rows={3}
          autoFocus
          placeholder="Off-message for this week's focus."
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
    </ConfirmDialog>
  )
}
