export interface NewsKeyword {
  id: string
  keywordId: string
  type: string
  topicLabel: string
  query: string
  terms: string[]
  places: string[]
  scope: string
  priority: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateKeywordInput {
  keywordId?: string
  type?: string
  topicLabel?: string
  query: string
  terms?: string[]
  places?: string[]
  scope?: string
  priority?: number
  active?: boolean
}

export type UpdateKeywordInput = Partial<CreateKeywordInput>

export interface CampaignProfile {
  userId: string
  candidateName: string
  party: string | null
  office: string | null
  district: string | null
  districtDescription: string | null
  districtTerms: string[]
  state: string | null
  electionDate: string | null
  personaSummary: string | null
  timezone: string
  newsRunHour: number
  topicsPerRun: number
  newsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export type CampaignProfileInput = Partial<
  Omit<CampaignProfile, "userId" | "createdAt" | "updatedAt">
>

export interface CandidatePosition {
  id: string
  issue: string
  stance: string
  sourceUrl: string | null
  lastVerifiedAt: string | null
  sortOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePositionInput {
  issue: string
  stance: string
  sourceUrl?: string | null
  lastVerifiedAt?: string | null
  sortOrder?: number
  active?: boolean
}

export type UpdatePositionInput = Partial<CreatePositionInput>

export type StylePlaybookSource = "MANUAL" | "GENERATED"

export interface StylePlaybookEntry {
  id: string
  label: string | null
  guidance: string
  isActive: boolean
  source: StylePlaybookSource
  sampleSize: number | null
  runId: string | null
  createdAt: string
  updatedAt: string
}
