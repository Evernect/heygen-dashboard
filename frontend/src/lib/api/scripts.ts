import { api } from "./client"
import type {
  ApproveScriptInput,
  RejectScriptInput,
  Script,
  ScriptStatus,
  UpdateScriptInput,
} from "@/lib/types/script"

export function listScripts(params?: {
  status?: ScriptStatus | "ALL"
  topicId?: string
}) {
  return api.get<Script[]>("api/scripts", {
    query: {
      status: params?.status === "ALL" ? undefined : params?.status,
      topicId: params?.topicId,
    },
  })
}

export function getScript(id: string) {
  return api.get<Script>(`api/scripts/${id}`)
}

export function updateScript(id: string, input: UpdateScriptInput) {
  return api.patch<Script>(`api/scripts/${id}`, input)
}

export function renderScript(id: string) {
  return api.post<Script>(`api/scripts/${id}/render`)
}

export function getRenderStatus(id: string) {
  return api.get<Script>(`api/scripts/${id}/render-status`)
}

export function approveScript(id: string, input: ApproveScriptInput) {
  return api.post<Script>(`api/scripts/${id}/approve`, input)
}

export function rejectScript(id: string, input: RejectScriptInput) {
  return api.post<Script>(`api/scripts/${id}/reject`, input)
}

export function retryScript(id: string) {
  return api.post<Script>(`api/scripts/${id}/retry`)
}
