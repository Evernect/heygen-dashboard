import * as XLSX from "xlsx"

export const MAX_IMPORT_ROWS = 200

export interface ParsedRow {
  rowNumber: number
  error: string | null
}

function normalise(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

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

export function sheetBoolean(value: string, fallback = true) {
  const text = value.trim().toLowerCase()
  if (!text) return fallback
  return ["y", "yes", "true", "1"].includes(text)
}

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

export function missingColumns(...names: string[]) {
  return new Error(
    `Missing ${names.map((name) => `'${name}'`).join(" and ")} — check the header row of your file.`
  )
}
