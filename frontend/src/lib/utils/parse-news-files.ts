import {
  cell,
  findColumn,
  missingColumns,
  pipeList,
  readSheetRecords,
  sheetBoolean,
  sheetDate,
  type ParsedRow,
} from "@/lib/utils/parse-sheet"
import type {
  CreateKeywordInput,
  CreatePositionInput,
} from "@/lib/types/news-config"

export interface ParsedKeywordRow extends ParsedRow, CreateKeywordInput {
  isUpdate: boolean
}

export interface ParsedPositionRow extends ParsedRow, CreatePositionInput {
  isUpdate: boolean
}

export async function parseKeywordsFile(
  file: File,
  existingCodes: string[] = []
): Promise<ParsedKeywordRow[]> {
  const { records, keys } = await readSheetRecords(file)

  const idKey = findColumn(keys, "keyword_id", "code", "id")
  const labelKey = findColumn(keys, "topic_label", "label", "topic")
  const queryKey = findColumn(keys, "query", "search", "feed")

  if (!idKey || !labelKey || !queryKey) {
    throw missingColumns("keyword_id", "topic_label", "query")
  }

  const typeKey = findColumn(keys, "type")
  const termsKey = findColumn(keys, "terms")
  const placesKey = findColumn(keys, "places")
  const scopeKey = findColumn(keys, "scope")
  const priorityKey = findColumn(keys, "priority")
  const activeKey = findColumn(keys, "active", "enabled")

  const known = new Set(existingCodes)
  const seen = new Set<string>()

  return records.map((record, index) => {
    const keywordId = cell(record, idKey)
    const topicLabel = cell(record, labelKey)
    const query = cell(record, queryKey)
    const priority = Number(cell(record, priorityKey))

    let error: string | null = null
    if (!keywordId) error = "Code is required"
    else if (seen.has(keywordId)) error = "Duplicate code in this file"
    else if (!topicLabel) error = "Topic label is required"
    else if (!query) error = "Query is required"

    if (keywordId) seen.add(keywordId)

    return {
      rowNumber: index + 1,
      keywordId,
      topicLabel,
      query,
      type: cell(record, typeKey) || "issue",
      terms: pipeList(cell(record, termsKey)),
      places: pipeList(cell(record, placesKey)),
      scope: cell(record, scopeKey) || "state",
      priority: Number.isFinite(priority) && priority > 0 ? priority : 3,
      active: sheetBoolean(cell(record, activeKey)),
      isUpdate: known.has(keywordId),
      error,
    }
  })
}

export async function parsePositionsFile(
  file: File,
  existingIssues: string[] = []
): Promise<ParsedPositionRow[]> {
  const { records, keys } = await readSheetRecords(file)

  const issueKey = findColumn(keys, "topic_label", "issue", "topic", "label")
  const stanceKey = findColumn(
    keys,
    "position_summary",
    "stance",
    "position",
    "summary"
  )

  if (!issueKey || !stanceKey) {
    throw missingColumns("topic_label", "position_summary")
  }

  const sourceKey = findColumn(keys, "source_url", "source", "url")
  const verifiedKey = findColumn(keys, "last_verified", "last_verified_at", "verified")
  const activeKey = findColumn(keys, "active", "enabled")

  const known = new Set(existingIssues)
  const seen = new Set<string>()

  return records.map((record, index) => {
    const issue = cell(record, issueKey)
    const stance = cell(record, stanceKey)
    const sourceUrl = cell(record, sourceKey)

    let error: string | null = null
    if (!issue) error = "Issue is required"
    else if (seen.has(issue)) error = "Duplicate issue in this file"
    else if (!stance) error = "Position is required"
    else if (sourceUrl && !isUrl(sourceUrl)) error = "Source is not a valid URL"

    if (issue) seen.add(issue)

    return {
      rowNumber: index + 1,
      issue,
      stance,
      sourceUrl: sourceUrl || null,
      lastVerifiedAt: sheetDate(cell(record, verifiedKey)),
      active: sheetBoolean(cell(record, activeKey)),
      isUpdate: known.has(issue),
      error,
    }
  })
}

export function keywordPayload(row: ParsedKeywordRow): CreateKeywordInput {
  return {
    keywordId: row.keywordId,
    type: row.type,
    topicLabel: row.topicLabel,
    query: row.query,
    terms: row.terms,
    places: row.places,
    scope: row.scope,
    priority: row.priority,
    active: row.active,
  }
}

export function positionPayload(row: ParsedPositionRow): CreatePositionInput {
  return {
    issue: row.issue,
    stance: row.stance,
    sourceUrl: row.sourceUrl,
    lastVerifiedAt: row.lastVerifiedAt,
    active: row.active,
  }
}

function isUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
