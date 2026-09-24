export const KEYWORD_TYPES = [
  { value: "issue", label: "Issue" },
  { value: "name", label: "Name (a person)" },
  { value: "geo", label: "Geo (a place)" },
  { value: "feed", label: "Feed (an outlet)" },
] as const

export const KEYWORD_SCOPES = [
  { value: "district", label: "District" },
  { value: "state", label: "State" },
  { value: "national", label: "National" },
] as const

export const DEFAULT_SCOPE = "state"
export const DEFAULT_PRIORITY = 4
export const MIN_PRIORITY = 1
export const MAX_PRIORITY = 5

export type QueryKind = "rss" | "geo" | "x" | "search"

export function queryKind(query: string): QueryKind {
  const text = query.trim()
  if (/^RSS:/i.test(text)) return "rss"
  if (/^GEO:/i.test(text)) return "geo"
  if (/^X:/i.test(text)) return "x"
  return "search"
}

export function defaultType(query: string) {
  const kind = queryKind(query)
  if (kind === "rss") return "feed"
  if (kind === "geo") return "geo"
  return "issue"
}

export function splitList(value: string) {
  return value
    .split(/[|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}
