import {
  cell,
  findColumn,
  missingColumns,
  readSheetRecords,
  type ParsedRow,
} from "@/lib/utils/parse-sheet"

export interface ParsedTopicRow extends ParsedRow {
  issue: string
  angle: string
}

export { MAX_IMPORT_ROWS as MAX_BULK_TOPIC_ROWS } from "@/lib/utils/parse-sheet"

function validateRow(issue: string, angle: string): string | null {
  const hasIssue = issue.length >= 3
  const hasAngle = angle.length >= 3

  if (!hasIssue && !hasAngle) return "Both issue and angle are required"
  if (!hasIssue) return "Issue too short"
  if (!hasAngle) return "Angle too short"
  return null
}

export async function parseTopicsFile(file: File): Promise<ParsedTopicRow[]> {
  const { records, keys } = await readSheetRecords(file)

  const issueKey = findColumn(keys, "issue")
  const angleKey = findColumn(keys, "angle")

  if (!issueKey || !angleKey) throw missingColumns("issue", "angle")

  return records.map((record, index) => {
    const issue = cell(record, issueKey)
    const angle = cell(record, angleKey)

    return {
      rowNumber: index + 1,
      issue,
      angle,
      error: validateRow(issue, angle),
    }
  })
}
