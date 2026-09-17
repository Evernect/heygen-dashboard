"use strict"

const { FRESHNESS_HOURS } = require("./scoring-constants")

/** Google News titles read "Headline - Outlet Name". */
const OUTLET_SEPARATOR = " - "

/**
 * Below this many characters before the separator, the " - " is part of the
 * headline rather than the outlet suffix. Carried over from the original
 * workflow, where it stopped short headlines being cut in half.
 */
const MIN_HEADLINE_LENGTH = 20

function stripHtml(value) {
  return String(value ?? "").replace(/<[^>]*>/g, " ")
}

function toArray(value) {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

/** RSS fields come through as either a string or `{ _: "text", ...attrs }`. */
function textOf(value) {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && typeof value._ === "string") return value._
  return String(value)
}

/**
 * Splits "Headline - Outlet" into its two halves, falling back to the feed's
 * own `<source>` element when the title carries no suffix.
 */
function splitGoogleNewsTitle(rawTitle, sourceElement) {
  const raw = String(rawTitle ?? "").trim()
  const at = raw.lastIndexOf(OUTLET_SEPARATOR)

  if (at > MIN_HEADLINE_LENGTH) {
    return {
      title: raw.slice(0, at).trim(),
      outlet: raw.slice(at + OUTLET_SEPARATOR.length).trim() || "unknown",
    }
  }

  return {
    title: raw,
    outlet: textOf(sourceElement).trim() || "unknown",
  }
}

/**
 * Whether an article is actually about what the keyword asked for.
 *
 * This is not redundant with the feed query. Google News ignores grouped
 * boolean operators, so `(gas tax OR "fuel tax") California` constrains almost
 * nothing — the feed comes back with whatever it felt like matching. The terms
 * and places columns exist to be enforced here, in code, after the fetch.
 * Deleting this check silently fills the pipeline with off-topic stories.
 *
 * An empty list means "no constraint", so a keyword can opt out of either half.
 */
function matchesRelevance(haystack, terms, places) {
  const hay = String(haystack ?? "").toLowerCase()

  const termList = (terms ?? []).map((t) => t.toLowerCase()).filter(Boolean)
  const placeList = (places ?? []).map((p) => p.toLowerCase()).filter(Boolean)

  if (termList.length && !termList.some((term) => hay.includes(term))) {
    return false
  }

  if (placeList.length && !placeList.some((place) => hay.includes(place))) {
    return false
  }

  return true
}

/**
 * Turns one parsed feed into article rows, dropping anything stale or
 * off-topic. Returns the kept rows plus counts, so a run can report how much a
 * keyword's filters threw away — usually the first clue that `terms` or
 * `places` is too narrow.
 */
function flattenFeedItems({
  feed,
  keyword,
  now = Date.now(),
  freshnessHours = FRESHNESS_HOURS,
}) {
  const cutoff = now - freshnessHours * 3600 * 1000
  const items = toArray(feed?.rss?.channel?.item)

  const articles = []
  let found = 0
  let stale = 0
  let offTopic = 0

  for (const item of items) {
    if (!item || !item.title) continue
    found += 1

    const publishedMs = item.pubDate ? new Date(item.pubDate).getTime() : now
    if (!publishedMs || Number.isNaN(publishedMs) || publishedMs < cutoff) {
      stale += 1
      continue
    }

    const { title, outlet } = splitGoogleNewsTitle(item.title, item.source)
    const description = stripHtml(item.description)

    if (!matchesRelevance(`${title} ${description}`, keyword.terms, keyword.places)) {
      offTopic += 1
      continue
    }

    articles.push({
      keywordId: keyword.keywordId,
      topicLabel: keyword.topicLabel,
      scope: keyword.scope,
      type: keyword.type,
      priority: Number(keyword.priority) || 1,
      title,
      outlet,
      description,
      link: textOf(item.link).trim(),
      publishedAt: new Date(publishedMs).toISOString(),
    })
  }

  return { articles, found, stale, offTopic }
}

module.exports = {
  stripHtml,
  textOf,
  toArray,
  splitGoogleNewsTitle,
  matchesRelevance,
  flattenFeedItems,
  MIN_HEADLINE_LENGTH,
}
