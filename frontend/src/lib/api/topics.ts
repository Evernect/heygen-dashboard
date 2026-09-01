import { api } from "./client"
import type {
  CreateTopicInput,
  Topic,
  TopicStatus,
  UpdateTopicInput,
} from "@/lib/types/topic"
import type { Script } from "@/lib/types/script"

export function listTopics(params?: { status?: TopicStatus | "ALL" }) {
  return api.get<Topic[]>("api/topics", {
    query: { status: params?.status === "ALL" ? undefined : params?.status },
  })
}

export function createTopic(input: CreateTopicInput) {
  return api.post<Topic>("api/topics", input)
}

export function updateTopic(id: string, input: UpdateTopicInput) {
  return api.patch<Topic>(`api/topics/${id}`, input)
}

export function deleteTopic(id: string) {
  return api.delete<void>(`api/topics/${id}`)
}

export function generateScriptFromTopic(id: string) {
  return api.post<Script>(`api/topics/${id}/generate`)
}
