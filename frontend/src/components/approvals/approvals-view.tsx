"use client"

import * as React from "react"
import { ClipboardCheck, Sparkles, TriangleAlert } from "lucide-react"

import { ApprovalsTable } from "@/components/approvals/approvals-table"
import { RejectDialog } from "@/components/approvals/reject-dialog"
import { ScriptDetailDialog } from "@/components/approvals/script-detail-dialog"
import { ScriptOptionsGrid } from "@/components/approvals/script-options-grid"
import { PageTransition } from "@/components/motion/page-transition"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { LinkButton } from "@/components/shared/link-button"
import { TableSkeleton } from "@/components/shared/loading-skeletons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { listScripts, renderScript, retryScript } from "@/lib/api/scripts"
import { APPROVAL_TABS } from "@/lib/constants/statuses"
import type { Script, ScriptStatus } from "@/lib/types/script"

type TabValue = ScriptStatus | "ALL"

const RENDERING_REFRESH_MS = 8000

const EMPTY_COPY: Record<TabValue, { title: string; description: string }> = {
  DRAFT: {
    title: "No scripts to choose from",
    description:
      "Generate scripts from a content bank topic and the options land here to pick from.",
  },
  RENDERING: {
    title: "No videos rendering",
    description:
      "Scripts show here while HeyGen builds the video, before you review it.",
  },
  PENDING_REVIEW: {
    title: "No videos to review",
    description:
      "Once a video finishes rendering it waits here for you to watch and approve.",
  },
  APPROVED: {
    title: "Nothing scheduled",
    description:
      "Approved videos appear here with their upload time until the scheduler picks them up.",
  },
  PROCESSING: {
    title: "Nothing publishing right now",
    description: "Videos show here while their posts go out to each platform.",
  },
  POSTED: {
    title: "Nothing published yet",
    description: "Videos that went live will be listed here with their posts.",
  },
  FAILED: {
    title: "No failures",
    description:
      "Anything that errors while rendering or publishing shows up here to retry.",
  },
  REJECTED: {
    title: "Nothing disapproved",
    description: "Scripts and videos you turn down are kept here for reference.",
  },
  ALL: {
    title: "No scripts yet",
    description:
      "Generate your first set of scripts from the content bank to get started.",
  },
}

export function ApprovalsView() {
  const { notifySuccess, notifyError } = useToastFeedback()
  const [tab, setTab] = React.useState<TabValue>("DRAFT")

  const { data, error, isLoading, refetch } = useAsyncData(
    () => listScripts({ status: tab }),
    [tab]
  )

  const [detailOpen, setDetailOpen] = React.useState(false)
  const [rejectTarget, setRejectTarget] = React.useState<Script | null>(null)
  const [renderingId, setRenderingId] = React.useState<string | null>(null)

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [selectedSnapshot, setSelectedSnapshot] = React.useState<Script | null>(
    null
  )

  const scripts = data ?? []

  const selected =
    (selectedId
      ? scripts.find((script) => script.id === selectedId)
      : undefined) ??
    selectedSnapshot

  const hasRendering = scripts.some((script) => script.status === "RENDERING")

  React.useEffect(() => {
    if (!hasRendering) return

    const timer = setInterval(() => void refetch(), RENDERING_REFRESH_MS)
    return () => clearInterval(timer)
  }, [hasRendering, refetch])

  function openDetail(script: Script) {
    setSelectedId(script.id)
    setSelectedSnapshot(script)
    setDetailOpen(true)
  }

  function handleChanged(updated?: Script) {
    if (updated) setSelectedSnapshot(updated)
    void refetch()
  }

  async function handleRender(script: Script) {
    setRenderingId(script.id)
    try {
      await renderScript(script.id)
      notifySuccess(
        "Generating the video",
        "It lands in Review video once HeyGen finishes."
      )
      setTab("RENDERING")
    } catch (caught) {
      notifyError("Could not start the video", caught)
      await refetch()
    } finally {
      setRenderingId(null)
    }
  }

  async function handleRetry(script: Script) {
    try {
      await retryScript(script.id)
      notifySuccess("Queued for another attempt")
      await refetch()
    } catch (caught) {
      notifyError("Could not retry", caught)
    }
  }

  const emptyCopy = EMPTY_COPY[tab]

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Pick a script, generate the video, then review it before approving an upload time."
        action={
          <LinkButton variant="brand" href="/content-bank">
            <Sparkles />
            Generate scripts
          </LinkButton>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
      >
        <TabsList className="mx-auto max-w-full justify-start overflow-x-auto overflow-y-hidden">
          {APPROVAL_TABS.map((entry) => (
            <TabsTrigger key={entry.value} value={entry.value}>
              {entry.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <TableSkeleton columns={6} />
      ) : error ? (
        <ErrorState
          icon={TriangleAlert}
          title="Could not load scripts"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : scripts.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={emptyCopy.title}
          description={emptyCopy.description}
          action={
            <LinkButton href="/content-bank">
              <Sparkles />
              Go to Content Bank
            </LinkButton>
          }
        />
      ) : tab === "DRAFT" ? (
        <ScriptOptionsGrid
          scripts={scripts}
          renderingId={renderingId}
          onOpen={openDetail}
          onRender={(script) => void handleRender(script)}
        />
      ) : (
        <ApprovalsTable
          scripts={scripts}
          onOpen={openDetail}
          onReject={setRejectTarget}
          onRetry={(script) => void handleRetry(script)}
          onRender={(script) => void handleRender(script)}
        />
      )}

      <ScriptDetailDialog
        script={selected ?? null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={handleChanged}
        onRequestReject={(script) => {
          setDetailOpen(false)
          setRejectTarget(script)
        }}
      />

      <RejectDialog
        script={rejectTarget}
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onRejected={() => void refetch()}
      />
    </PageTransition>
  )
}
