"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Library, Plus, TriangleAlert, Upload } from "lucide-react"

import { PageTransition } from "@/components/motion/page-transition"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeletons"
import { PageHeader } from "@/components/shared/page-header"
import { BulkImportTopicsDialog } from "@/components/content-bank/bulk-import-dialog"
import { TopicFormDialog } from "@/components/content-bank/topic-form-dialog"
import { TopicsTable } from "@/components/content-bank/topics-table"
import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  deleteTopic,
  generateScriptFromTopic,
  listTopics,
} from "@/lib/api/topics"
import { TOPIC_TABS } from "@/lib/constants/statuses"
import type { Topic, TopicStatus } from "@/lib/types/topic"

type TabValue = TopicStatus | "ALL"

const PAGE_SIZE = 20

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)

  const result: (number | "ellipsis")[] = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis")
    result.push(page)
  })
  return result
}

const EMPTY_COPY: Record<TabValue, { title: string; description: string }> = {
  ALL: {
    title: "No topics yet",
    description:
      "Add an issue and the angle you want to take on it, then generate a script from it.",
  },
  IDLE: {
    title: "No idle topics",
    description: "Topics waiting to have a script generated show up here.",
  },
  GENERATED: {
    title: "No generated topics yet",
    description: "Topics with a script already generated show up here.",
  },
  GENERATING: {
    title: "Nothing generating right now",
    description: "Topics currently generating a script show up here.",
  },
  ERROR: {
    title: "No errors",
    description: "Topics whose last generation attempt failed show up here.",
  },
}

export function ContentBankView() {
  const router = useRouter()
  const { notifySuccess, notifyError } = useToastFeedback()
  const [tab, setTab] = React.useState<TabValue>("ALL")
  const [page, setPage] = React.useState(1)

  const { data, error, isLoading, refetch } = useAsyncData(
    () => listTopics({ status: tab, page, pageSize: PAGE_SIZE }),
    [tab, page]
  )

  const [formOpen, setFormOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [editingTopic, setEditingTopic] = React.useState<Topic | null>(null)
  const [topicToDelete, setTopicToDelete] = React.useState<Topic | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [generatingId, setGeneratingId] = React.useState<string | null>(null)

  const topics = data?.topics ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  if (data && page > totalPages) {
    setPage(totalPages)
  }

  function handleTabChange(value: TabValue) {
    setTab(value)
    setPage(1)
  }

  function openCreate() {
    setEditingTopic(null)
    setFormOpen(true)
  }

  function openEdit(topic: Topic) {
    setEditingTopic(topic)
    setFormOpen(true)
  }

  async function handleGenerate(topic: Topic) {
    setGeneratingId(topic.id)
    try {
      await generateScriptFromTopic(topic.id)
      notifySuccess(
        "Script generated",
        "It's waiting for you in the approval queue."
      )
      await refetch()
      router.push("/approvals")
    } catch (caught) {
      notifyError("Generation failed", caught)
      await refetch()
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleDelete() {
    if (!topicToDelete) return

    setIsDeleting(true)
    try {
      await deleteTopic(topicToDelete.id)
      notifySuccess("Topic deleted")
      await refetch()
    } catch (caught) {
      notifyError("Could not delete topic", caught)
    } finally {
      setTopicToDelete(null)
      setIsDeleting(false)
    }
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Content Bank"
        description="Issues and angles that scripts are generated from."
        action={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload />
              Import
            </Button>
            <Button variant="brand" onClick={openCreate}>
              <Plus />
              New topic
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) => handleTabChange(value as TabValue)}
      >
        <TabsList className="mx-auto max-w-full justify-start overflow-x-auto overflow-y-hidden">
          {TOPIC_TABS.map((entry) => (
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
          title="Could not load the content bank"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : topics.length === 0 ? (
        <EmptyState
          icon={Library}
          title={EMPTY_COPY[tab].title}
          description={EMPTY_COPY[tab].description}
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first topic
            </Button>
          }
        />
      ) : (
        <>
          <TopicsTable
            topics={topics}
            generatingId={generatingId}
            onGenerate={(topic) => void handleGenerate(topic)}
            onEdit={openEdit}
            onDelete={setTopicToDelete}
          />

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : undefined
                    }
                    onClick={(event) => {
                      event.preventDefault()
                      if (page > 1) setPage(page - 1)
                    }}
                  />
                </PaginationItem>
                {getPageNumbers(page, totalPages).map((entry, index) =>
                  entry === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={entry}>
                      <PaginationLink
                        href="#"
                        isActive={entry === page}
                        onClick={(event) => {
                          event.preventDefault()
                          setPage(entry)
                        }}
                      >
                        {entry}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    onClick={(event) => {
                      event.preventDefault()
                      if (page < totalPages) setPage(page + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <TopicFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        topic={editingTopic}
        onSaved={() => void refetch()}
      />

      <BulkImportTopicsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(topicToDelete)}
        onOpenChange={(open) => !open && setTopicToDelete(null)}
        title="Delete this topic?"
        description={
          <>
            <span className="font-medium text-foreground">
              {topicToDelete?.issue}
            </span>{" "}
            will be removed from the content bank. Topics that already have
            generated scripts can&apos;t be deleted.
          </>
        }
        confirmLabel="Delete"
        destructive
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </PageTransition>
  )
}
