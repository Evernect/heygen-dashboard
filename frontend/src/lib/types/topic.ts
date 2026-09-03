export const TOPIC_STATUSES = [
  "IDLE",
  "GENERATING",
  "GENERATED",
  "ERROR",
] as const

export type TopicStatus = (typeof TOPIC_STATUSES)[number]

// A row in the content bank
export interface Topic {
  id: string
  issue: string
  angle: string
  status: TopicStatus
  timesUsed: number
  lastUsedAt: string | null
  generateError: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTopicInput {
  issue: string
  angle: string
}

export type UpdateTopicInput = Partial<CreateTopicInput>

export interface BulkCreateTopicsResponse {
  created: Topic[]
  count: number
}

export interface PaginatedTopics {
  topics: Topic[]
  total: number
  page: number
  pageSize: number
}
