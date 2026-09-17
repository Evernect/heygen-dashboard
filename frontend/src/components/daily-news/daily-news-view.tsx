"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Newspaper, TriangleAlert } from "lucide-react"

import { DailyNewsTable } from "@/components/daily-news/daily-news-table"
import { NewsItemDetailDialog } from "@/components/daily-news/news-item-detail-dialog"
import { NewsItemEditDialog } from "@/components/daily-news/news-item-edit-dialog"
import { RunStatusStrip } from "@/components/daily-news/run-status-strip"
import { PageTransition } from "@/components/motion/page-transition"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeletons"
import { PageHeader } from "@/components/shared/page-header"
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
  deleteDailyNewsItem,
  dismissDailyNewsItem,
  generateScriptsFromNewsItem,
  listDailyNews,
} from "@/lib/api/daily-news"
import { DAILY_NEWS_TABS } from "@/lib/constants/statuses"
import { getPageNumbers } from "@/lib/pagination"
import type { DailyNewsItem, DailyNewsStatus } from "@/lib/types/daily-news"

type TabValue = DailyNewsStatus | "ALL"

const PAGE_SIZE = 20

const EMPTY_COPY: Record<TabValue, { title: string; description: string }> = {
  ALL: {
    title: "Nothing here yet",
    description:
      "Topics picked from the morning's news appear here. Run it now to see what today holds.",
  },
  NEW: {
    title: "No new topics",
    description:
      "Topics waiting to have scripts generated show up here after each morning run.",
  },
  GENERATING: {
    title: "Nothing generating right now",
    description: "Topics currently generating scripts show up here.",
  },
  GENERATED: {
    title: "No generated topics yet",
    description: "Topics you have already generated scripts from show up here.",
  },
  ERROR: {
    title: "No errors",
    description: "Topics whose last generation attempt failed show up here.",
  },
  DISMISSED: {
    title: "Nothing dismissed",
    description: "Topics you passed on show up here.",
  },
}

export function DailyNewsView() {
  const router = useRouter()
  const { notifySuccess, notifyError } = useToastFeedback()

  const [tab, setTab] = React.useState<TabValue>("NEW")
  const [page, setPage] = React.useState(1)

  const { data, error, isLoading, refetch } = useAsyncData(
    () => listDailyNews({ status: tab, page, pageSize: PAGE_SIZE }),
    [tab, page]
  )

  const [generatingId, setGeneratingId] = React.useState<string | null>(null)
  const [viewing, setViewing] = React.useState<DailyNewsItem | null>(null)
  const [editing, setEditing] = React.useState<DailyNewsItem | null>(null)
  const [toDelete, setToDelete] = React.useState<DailyNewsItem | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const items = data?.items ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  if (data && page > totalPages) {
    setPage(totalPages)
  }

  function handleTabChange(value: TabValue) {
    setTab(value)
    setPage(1)
  }

  async function handleGenerate(item: DailyNewsItem) {
    setGeneratingId(item.id)
    try {
      const { count } = await generateScriptsFromNewsItem(item.id)
      notifySuccess(
        `${count} scripts generated`,
        "Pick the one you want turned into a video."
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

  async function handleDismiss(item: DailyNewsItem) {
    try {
      await dismissDailyNewsItem(item.id)
      notifySuccess("Topic dismissed")
      await refetch()
    } catch (caught) {
      notifyError("Could not dismiss this topic", caught)
    }
  }

  async function handleDelete() {
    if (!toDelete) return

    setIsDeleting(true)
    try {
      await deleteDailyNewsItem(toDelete.id)
      notifySuccess("Topic deleted")
      await refetch()
    } catch (caught) {
      notifyError("Could not delete this topic", caught)
    } finally {
      setToDelete(null)
      setIsDeleting(false)
    }
  }

  const onRunFinished = React.useCallback(() => {
    void refetch()
  }, [refetch])

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Daily News"
        description="Topics picked from this morning's news. Generating one gives you three scripts to choose from."
      />

      <RunStatusStrip onFinished={onRunFinished} />

      <Tabs
        value={tab}
        onValueChange={(value) => handleTabChange(value as TabValue)}
      >
        <TabsList className="mx-auto max-w-full justify-start overflow-x-auto overflow-y-hidden">
          {DAILY_NEWS_TABS.map((entry) => (
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
          title="Could not load the daily news"
          description={error.message}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={EMPTY_COPY[tab].title}
          description={EMPTY_COPY[tab].description}
        />
      ) : (
        <>
          <DailyNewsTable
            items={items}
            generatingId={generatingId}
            onGenerate={(item) => void handleGenerate(item)}
            onView={setViewing}
            onEdit={setEditing}
            onDismiss={(item) => void handleDismiss(item)}
            onDelete={setToDelete}
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

      <NewsItemDetailDialog
        item={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      />

      <NewsItemEditDialog
        item={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSaved={() => void refetch()}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete this topic?"
        description={
          <>
            <span className="font-medium text-foreground">
              {toDelete?.topic}
            </span>{" "}
            will be removed. Topics that already have generated scripts
            can&apos;t be deleted.
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
