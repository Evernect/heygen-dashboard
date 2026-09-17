export interface NewsKeyword {
  id: string
  keywordId: string
  type: string
  topicLabel: string
  query: string
  /** An article must mention one of these… */
  terms: string[]
  /** …and one of these, or it is dropped as off-topic. */
  places: string[]
  scope: string
  priority: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateKeywordInput {
  keywordId: string
  type?: string
  topicLabel: string
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
  /** Place names that mark a story as local, feeding the district score. */
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

export interface StylePlaybookEntry {
  id: string
  label: string | null
  guidance: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
