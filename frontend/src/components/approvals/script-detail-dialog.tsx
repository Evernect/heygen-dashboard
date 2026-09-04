"use client"

import * as React from "react"
import { Clapperboard, Loader2, Pencil, Save, X } from "lucide-react"

import { ApproveForm } from "@/components/approvals/approve-form"
import {
  CaptionTabs,
  type CaptionField,
} from "@/components/approvals/caption-tabs"
import { PublishStatusPanel } from "@/components/approvals/publish-status-panel"
import { RenderProgress } from "@/components/approvals/render-progress"
import { ScriptBody } from "@/components/approvals/script-body"
import { VideoPreview } from "@/components/approvals/video-preview"
import { ScriptStatusBadge } from "@/components/shared/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  approveScript,
  renderScript,
  retryScript,
  updateScript,
} from "@/lib/api/scripts"
import type { Platform } from "@/lib/types/platform"
import type { Script } from "@/lib/types/script"

type Draft = Pick<Script, "title" | "scriptText"> &
  Record<CaptionField, string | null>

function toDraft(script: Script): Draft {
  return {
    title: script.title,
    scriptText: script.scriptText,
    facebookCaption: script.facebookCaption,
    instagramCaption: script.instagramCaption,
    youtubeCaption: script.youtubeCaption,
    tiktokCaption: script.tiktokCaption,
    xPostText: script.xPostText,
  }
}

export function ScriptDetailDialog({
  script,
  open,
  onOpenChange,
  onChanged,
  onRequestReject,
}: {
  script: Script | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after any change; passes the fresh row when the caller has one. */
  onChanged: (updated?: Script) => void
  onRequestReject: (script: Script) => void
}) {
  const { notifySuccess, notifyError } = useToastFeedback()

  const [draft, setDraft] = React.useState<Draft | null>(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const seedKey = open && script ? script.id : null
  const [lastSeedKey, setLastSeedKey] = React.useState(seedKey)
  if (seedKey !== lastSeedKey) {
    setLastSeedKey(seedKey)
    if (script && seedKey !== null) {
      setDraft(toDraft(script))
      setIsEditing(false)
    }
  }

  if (!script || !draft) return null

  // Text is only editable while the script is still an unrendered option —
  // once HeyGen has spoken it, editing would desync the words from the video.
  const isDraft = script.status === "DRAFT"
  const isRendering = script.status === "RENDERING"
  const isAwaitingReview = script.status === "PENDING_REVIEW"
  const isDirty = JSON.stringify(draft) !== JSON.stringify(toDraft(script))

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
  }

  async function handleSave() {
    if (!script || !draft) return

    setIsSaving(true)
    try {
      await updateScript(script.id, draft)
      notifySuccess("Changes saved")
      setIsEditing(false)
      onChanged()
    } catch (error) {
      notifyError("Could not save changes", error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRender() {
    if (!script) return

    setIsSubmitting(true)
    try {
      if (isDirty && draft) await updateScript(script.id, draft)

      await renderScript(script.id)
      notifySuccess(
        "Generating the video",
        "It lands in Review video once HeyGen finishes."
      )
      onChanged()
    } catch (error) {
      notifyError("Could not start the video", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleApprove(input: {
    scheduledAt: Date
    targetPlatforms: Platform[]
  }) {
    if (!script) return

    setIsSubmitting(true)
    try {
      await approveScript(script.id, {
        scheduledAt: input.scheduledAt.toISOString(),
        targetPlatforms: input.targetPlatforms,
      })

      notifySuccess(
        "Approved",
        "The video will be uploaded at the scheduled time."
      )
      onOpenChange(false)
      onChanged()
    } catch (error) {
      notifyError("Could not approve script", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRetry() {
    if (!script) return

    setIsSubmitting(true)
    try {
      await retryScript(script.id)
      notifySuccess("Queued for another attempt")
      onOpenChange(false)
      onChanged()
    } catch (error) {
      notifyError("Could not retry", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="max-h-[90vh] overflow-y-auto p-4">
          <DialogHeader className="pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <ScriptStatusBadge status={script.status} />
              {script.variantLabel && (
                <Badge variant="secondary">{script.variantLabel}</Badge>
              )}
              {script.topic && (
                <span className="text-xs text-muted-foreground">
                  {script.topic.issue}
                </span>
              )}
            </div>
            <DialogTitle className="text-lg">{script.title}</DialogTitle>
            {script.topic?.angle && (
              <DialogDescription>{script.topic.angle}</DialogDescription>
            )}
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {script.videoStorageUrl && (
              <VideoPreview videoUrl={script.videoStorageUrl} />
            )}

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Script</Label>
                {isDraft && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsEditing((value) => !value)}
                  >
                    {isEditing ? <X /> : <Pencil />}
                    {isEditing ? "Done editing" : "Edit"}
                  </Button>
                )}
              </div>
              <ScriptBody
                value={draft.scriptText}
                isEditing={isEditing}
                onChange={(value) => updateDraft("scriptText", value)}
              />
            </section>

            <section className="space-y-2">
              <Label>Captions</Label>
              <CaptionTabs
                values={draft}
                readOnly={!isDraft}
                onChange={(field, value) => updateDraft(field, value)}
              />
            </section>

            {script.hashtags.length > 0 && (
              <section className="space-y-2">
                <Label>Hashtags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {script.hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {isDraft && isDirty && (
              <>
                <Separator />
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                    Save edits
                  </Button>
                </div>
              </>
            )}

            {isDraft ? (
              <SelectScriptPanel
                isSubmitting={isSubmitting}
                onRender={() => void handleRender()}
                onReject={() => onRequestReject(script)}
              />
            ) : isRendering ? (
              <RenderProgress script={script} onFinished={onChanged} />
            ) : isAwaitingReview ? (
              <ApproveForm
                script={script}
                isSubmitting={isSubmitting}
                onApprove={(input) => void handleApprove(input)}
                onReject={() => onRequestReject(script)}
              />
            ) : (
              <PublishStatusPanel
                script={script}
                isRetrying={isSubmitting}
                onRetry={() => void handleRetry()}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SelectScriptPanel({
  isSubmitting,
  onRender,
  onReject,
}: {
  isSubmitting: boolean
  onRender: () => void
  onReject: () => void
}) {
  return (
    <div className="space-y-4">
      <Separator />

      <p className="text-xs text-muted-foreground">
        Picking this script sends it to HeyGen and spends a render. You&apos;ll
        review the finished video before anything is scheduled or uploaded.
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="destructive" onClick={onReject} disabled={isSubmitting}>
          Disapprove
        </Button>
        <Button variant="brand" onClick={onRender} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Clapperboard />
          )}
          Use this script &amp; generate video
        </Button>
      </div>
    </div>
  )
}
