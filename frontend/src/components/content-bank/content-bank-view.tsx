"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Library, Plus, TriangleAlert } from "lucide-react"

import { PageTransition } from "@/components/motion/page-transition"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState, ErrorState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeletons"
import { PageHeader } from "@/components/shared/page-header"
import { TopicFormDialog } from "@/components/content-bank/topic-form-dialog"
import { TopicsTable } from "@/components/content-bank/topics-table"
import { Button } from "@/components/ui/button"
import { useAsyncData } from "@/hooks/use-async-data"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import {
  deleteTopic,
  generateScriptFromTopic,
  listTopics,
} from "@/lib/api/topics"
import type { Topic } from "@/lib/types/topic"

export function ContentBankView() {
  const router = useRouter()
  const { notifySuccess, notifyError } = useToastFeedback()

  const { data, error, isLoading, refetch } = useAsyncData(
    () => listTopics(),
    []
  )

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingTopic, setEditingTopic] = React.useState<Topic | null>(null)
  const [topicToDelete, setTopicToDelete] = React.useState<Topic | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [generatingId, setGeneratingId] = React.useState<string | null>(null)

  const topics = data ?? []

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
      setTopicToDelete(null)
      await refetch()
    } catch (caught) {
      notifyError("Could not delete topic", caught)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        title="Content Bank"
        description="Issues and angles that scripts are generated from."
        action={
          <Button onClick={openCreate}>
            <Plus />
            New topic
          </Button>
        }
      />

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
          title="No topics yet"
          description="Add an issue and the angle you want to take on it, then generate a script from it."
          action={
            <Button onClick={openCreate}>
              <Plus />
              Add your first topic
            </Button>
          }
        />
      ) : (
        <TopicsTable
          topics={topics}
          generatingId={generatingId}
          onGenerate={(topic) => void handleGenerate(topic)}
          onEdit={openEdit}
          onDelete={setTopicToDelete}
        />
      )}

      <TopicFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        topic={editingTopic}
        onSaved={() => void refetch()}
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
