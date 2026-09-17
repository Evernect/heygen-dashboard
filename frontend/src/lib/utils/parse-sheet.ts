import * as XLSX from "xlsx"

/** Every importer shares this ceiling, and so do the backend bulk endpoints. */
export const MAX_IMPORT_ROWS = 200

export interface ParsedRow {
  rowNumber: number
  error: string | null
}

/**
 * Header lookup that forgives how a column was actually spelled.
 *
 * The original Google Sheets tabs use snake_case (`keyword_id`,
 * `position_summary`), but someone re-typing a sheet by hand writes "Keyword
 * ID". Both normalise to the same thing.
 */
function normalise(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

/**
 * The first matching column name, or undefined. Aliases are tried in order, so
 * put the sheet's own spelling first.
 */
export function findColumn(keys: string[], ...aliases: string[]) {
  const normalised = new Map(keys.map((key) => [normalise(key), key]))

  for (const alias of aliases) {
    const match = normalised.get(normalise(alias))
    if (match) return match
  }

  return undefined
}

export function cell(record: Record<string, unknown>, key: string | undefined) {
  if (!key) return ""
  return String(record[key] ?? "").trim()
}

/** A pipe-separated column, the way the sheets store lists. */
export function pipeList(value: string) {
  return value
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/** The sheets use Y/N; a re-typed file might use TRUE or 1. */
export function sheetBoolean(value: string, fallback = true) {
  const text = value.trim().toLowerCase()
  if (!text) return fallback
  return ["y", "yes", "true", "1"].includes(text)
}

/**
 * Excel serial dates come back as numbers unless asked otherwise, so a date
 * cell is read leniently and simply dropped when it makes no sense.
 */
export function sheetDate(value: string): string | null {
  if (!value) return null

  const serial = Number(value)
  if (Number.isFinite(serial) && serial > 0 && serial < 100000) {
    const parsed = XLSX.SSF.parse_date_code(serial)
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d)).toISOString()
    }
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/**
 * Reads the first sheet of a CSV or Excel file into records, with the row
 * ceiling applied.
 */
export async function readSheetRecords(file: File) {
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

  if (records.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `File has ${records.length} rows — the limit is ${MAX_IMPORT_ROWS} per import.`
    )
  }

  return { records, keys: Object.keys(records[0]) }
}

/** The error shown when a file has none of the columns an importer needs. */
export function missingColumns(...names: string[]) {
  return new Error(
    `Missing ${names.map((name) => `'${name}'`).join(" and ")} — check the header row of your file.`
  )
}
