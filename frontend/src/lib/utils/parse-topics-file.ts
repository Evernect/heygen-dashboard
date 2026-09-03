import * as XLSX from "xlsx"

export interface ParsedTopicRow {
  rowNumber: number
  issue: string
  angle: string
  error: string | null
}

export const MAX_BULK_TOPIC_ROWS = 200

function findColumnKey(keys: string[], target: string) {
  return keys.find((key) => key.trim().toLowerCase() === target)
}

function validateRow(issue: string, angle: string): string | null {
  const hasIssue = issue.length >= 3
  const hasAngle = angle.length >= 3

  if (!hasIssue && !hasAngle) return "Both issue and angle are required"
  if (!hasIssue) return "Issue too short"
  if (!hasAngle) return "Angle too short"
  return null
}

export async function parseTopicsFile(file: File): Promise<ParsedTopicRow[]> {
  let workbook: XLSX.WorkBook

  try {
    const buffer = await file.arrayBuffer()
    workbook = XLSX.read(buffer, { type: "array" })
  } catch {
    throw new Error(
      "Could not read this file — make sure it's a valid CSV or Excel file."
    )
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  })

  if (records.length === 0) {
    throw new Error("No rows found in this file.")
  }

  const keys = Object.keys(records[0])
  const issueKey = findColumnKey(keys, "issue")
  const angleKey = findColumnKey(keys, "angle")

  if (!issueKey || !angleKey) {
    throw new Error(
      "Missing 'issue' and 'angle' columns — check the header row of your file."
    )
  }

  if (records.length > MAX_BULK_TOPIC_ROWS) {
    throw new Error(
      `File has ${records.length} rows — the limit is ${MAX_BULK_TOPIC_ROWS} per import.`
    )
  }

  return records.map((record, index) => {
    const issue = String(record[issueKey] ?? "").trim()
    const angle = String(record[angleKey] ?? "").trim()

    return {
      rowNumber: index + 1,
      issue,
      angle,
      error: validateRow(issue, angle),
    }
  })
}
