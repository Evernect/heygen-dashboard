import { api } from "./client"
import type {
  CampaignProfile,
  CampaignProfileInput,
  CandidatePosition,
  CreateKeywordInput,
  CreatePositionInput,
  NewsKeyword,
  StylePlaybookEntry,
  UpdateKeywordInput,
  UpdatePositionInput,
} from "@/lib/types/news-config"

// --- Keywords ---

export function listKeywords() {
  return api.get<{ keywords: NewsKeyword[] }>("api/news/keywords")
}

export function createKeyword(input: CreateKeywordInput) {
  return api.post<NewsKeyword>("api/news/keywords", input)
}

/** Upserts on the keyword code, so re-importing an edited sheet updates. */
export function bulkUpsertKeywords(keywords: CreateKeywordInput[]) {
  return api.post<{ keywords: NewsKeyword[]; count: number }>(
    "api/news/keywords/bulk",
    { keywords }
  )
}

export function updateKeyword(id: string, input: UpdateKeywordInput) {
  return api.patch<NewsKeyword>(`api/news/keywords/${id}`, input)
}

export function deleteKeyword(id: string) {
  return api.delete<void>(`api/news/keywords/${id}`)
}

// --- Campaign profile ---

export function getCampaignProfile() {
  return api.get<{ profile: CampaignProfile | null; timezones: string[] }>(
    "api/news/campaign-profile"
  )
}

export function saveCampaignProfile(input: CampaignProfileInput) {
  return api.put<{ profile: CampaignProfile }>(
    "api/news/campaign-profile",
    input
  )
}

// --- Positions ---

export function listPositions() {
  return api.get<{ positions: CandidatePosition[] }>("api/news/positions")
}

export function createPosition(input: CreatePositionInput) {
  return api.post<CandidatePosition>("api/news/positions", input)
}

/** Matches an existing position on its issue, so a corrected sheet updates. */
export function bulkUpsertPositions(positions: CreatePositionInput[]) {
  return api.post<{ positions: CandidatePosition[]; count: number }>(
    "api/news/positions/bulk",
    { positions }
  )
}

export function updatePosition(id: string, input: UpdatePositionInput) {
  return api.patch<CandidatePosition>(`api/news/positions/${id}`, input)
}

export function deletePosition(id: string) {
  return api.delete<void>(`api/news/positions/${id}`)
}

// --- Style playbook ---

export function listStylePlaybook() {
  return api.get<{ entries: StylePlaybookEntry[] }>("api/news/style-playbook")
}

export function createStylePlaybookEntry(input: {
  guidance: string
  label?: string | null
}) {
  return api.post<StylePlaybookEntry>("api/news/style-playbook", input)
}

export function deleteStylePlaybookEntry(id: string) {
  return api.delete<void>(`api/news/style-playbook/${id}`)
}
