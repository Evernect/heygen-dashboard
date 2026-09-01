"use client"

import * as React from "react"
import { ClipboardCheck, Sparkles, TriangleAlert } from "lucide-react"

import { ApprovalsTable } from "@/components/approvals/approvals-table"
import { RejectDialog } from "@/components/approvals/reject-dialog"
import { ScriptDetailDialog } from "@/components/approvals/script-detail-dialog"
import { PageTransition } from "@/components/motion/page-transition"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { LinkButton } from "@/components/shared/link-button"
import { TableSkeleton } from "@/components/shared/loading-skeletons"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { listScripts, retryScript } from "@/lib/api/scripts"
import { APPROVAL_TABS } from "@/lib/constants/statuses"
import type { Script, ScriptStatus } from "@/lib/types/script"

type TabValue = ScriptStatus | "ALL"

const EMPTY_COPY: Record<TabValue, { title: string; description: string }> = {
  PENDING_REVIEW: {
    title: "No scripts pending review",
    description:
      "Generate a script from the content bank and it will land here for approval.",
  },
  APPROVED: {
    title: "Nothing scheduled",
    description:
      "Approved scripts appear here with their publish time until the scheduler picks them up.",
  },
  PROCESSING: {
    title: "Nothing publishing right now",
    description:
      "Scripts show here while their video renders and posts go out.",
  },
  POSTED: {
    title: "Nothing published yet",
    description: "Videos that went live will be listed here with their posts.",
  },
  FAILED: {
    title: "No failures",
    description: "Anything that errors while publishing shows up here to retry.",
  },
  REJECTED: {
    title: "Nothing disapproved",
    description: "Scripts you turn down are kept here for reference.",
  },
  ALL: {
    title: "No scripts yet",
    description:
      "Generate your first script from the content bank to get started.",
  },
}

export function ApprovalsView() {
  const { notifySuccess, notifyError } = useToastFeedback()
  const [tab, setTab] = React.useState<TabValue>("PENDING_REVIEW")

  const { data, error, isLoading, refetch } = useAsyncData(
    () => listScripts({ status: tab }),
    [tab]
  )

  const [selected, setSelected] = React.useState<Script | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [rejectTarget, setRejectTarget] = React.useState<Script | null>(null)

  const scripts = data ?? []

  function openDetail(script: Script) {
    setSelected(script)
    setDetailOpen(true)
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
        description="Review generated scripts, then approve and schedule them."
        action={
          <LinkButton variant="outline" href="/content-bank">
            <Sparkles />
            Generate a script
          </LinkButton>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
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
      ) : (
        <ApprovalsTable
          scripts={scripts}
          onOpen={openDetail}
          onReject={setRejectTarget}
          onRetry={(script) => void handleRetry(script)}
        />
      )}

      <ScriptDetailDialog
        script={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={() => void refetch()}
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
