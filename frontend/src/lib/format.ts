import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = typeof value === "string" ? parseISO(value) : value
  return isValid(date) ? date : null
}

export function formatDateTime(value: string | Date | null | undefined) {
  const date = toDate(value)
  return date ? format(date, "dd MMM yyyy, hh:mm a") : "—"
}

export function formatDate(value: string | Date | null | undefined) {
  const date = toDate(value)
  return date ? format(date, "dd MMM yyyy") : "—"
}

export function formatTime(value: string | Date | null | undefined) {
  const date = toDate(value)
  return date ? format(date, "hh:mm a") : "—"
}

export function formatRelative(value: string | Date | null | undefined) {
  const date = toDate(value)
  return date ? `${formatDistanceToNow(date)} ago` : "—"
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-US").format(value)
}

export function countSpokenWords(scriptText: string) {
  return scriptText
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function stripSsml(scriptText: string) {
  return scriptText.replace(/<break[^>]*\/>/g, "").replace(/\s+/g, " ").trim()
}
