import { api } from "./client"
import type {
  DailyNewsItem,
  DailyNewsStatus,
  LatestRunResponse,
  NewsRun,
  PaginatedDailyNews,
  UpdateDailyNewsItemInput,
} from "@/lib/types/daily-news"
import type { Script } from "@/lib/types/script"

export function listDailyNews(params?: {
  status?: DailyNewsStatus | "ALL"
  page?: number
  pageSize?: number
}) {
  return api.get<PaginatedDailyNews>("api/daily-news", {
    query: {
      status: params?.status === "ALL" ? undefined : params?.status,
      page: params?.page,
      pageSize: params?.pageSize,
    },
  })
}

export function updateDailyNewsItem(
  id: string,
  input: UpdateDailyNewsItemInput
) {
  return api.patch<DailyNewsItem>(`api/daily-news/${id}`, input)
}

export function generateScriptsFromNewsItem(id: string) {
  return api.post<{ scripts: Script[]; count: number }>(
    `api/daily-news/${id}/generate`
  )
}

export function dismissDailyNewsItem(id: string) {
  return api.post<DailyNewsItem>(`api/daily-news/${id}/dismiss`)
}

export function deleteDailyNewsItem(id: string) {
  return api.delete<void>(`api/daily-news/${id}`)
}

/**
 * Starts a run and returns as soon as it is accepted — the run itself takes
 * minutes. Progress is followed through `getLatestRun`.
 */
export function runNewsPipeline(force = false) {
  return api.post<{ status: string }>("api/daily-news/run", { force })
}

export function listNewsRuns() {
  return api.get<{ runs: NewsRun[] }>("api/daily-news/runs")
}

export function getLatestRun() {
  return api.get<LatestRunResponse>("api/daily-news/runs/latest")
}
