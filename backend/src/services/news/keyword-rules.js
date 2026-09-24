"use strict"

const KEYWORD_TYPES = ["issue", "name", "geo", "feed"]
const KEYWORD_SCOPES = ["district", "state", "national"]

const DEFAULT_SCOPE = "state"
const DEFAULT_PRIORITY = 4
const MIN_PRIORITY = 1
const MAX_PRIORITY = 5

const DEFAULT_WINDOW = "when:1d"
const WINDOW_PATTERN = /\bwhen:\d+[hd]\b/i

const LABEL_LENGTH = 60

const PREFIXES = [
  { kind: "rss", pattern: /^RSS:/i },
  { kind: "geo", pattern: /^GEO:/i },
  { kind: "x", pattern: /^X:/i },
]

function parseQuery(query) {
  const text = String(query ?? "").trim()

  for (const { kind, pattern } of PREFIXES) {
    if (pattern.test(text)) {
      return { kind, body: text.replace(pattern, "").trim() }
    }
  }

  return { kind: "search", body: normaliseSearch(text) }
}

function normaliseSearch(text) {
  return text.replace(/[,;]+/g, " ").replace(/\s+/g, " ").trim()
}

function withDefaultWindow(search) {
  return WINDOW_PATTERN.test(search) ? search : `${search} ${DEFAULT_WINDOW}`
}

function defaultType(query) {
  const { kind } = parseQuery(query)
  if (kind === "rss") return "feed"
  if (kind === "geo") return "geo"
  return "issue"
}

function defaultTopicLabel(query) {
  return parseQuery(query).body.slice(0, LABEL_LENGTH)
}

module.exports = {
  KEYWORD_TYPES,
  KEYWORD_SCOPES,
  DEFAULT_SCOPE,
  DEFAULT_PRIORITY,
  MIN_PRIORITY,
  MAX_PRIORITY,
  DEFAULT_WINDOW,
  parseQuery,
  withDefaultWindow,
  defaultType,
  defaultTopicLabel,
}
