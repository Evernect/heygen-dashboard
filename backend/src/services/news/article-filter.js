"use strict"

const { FRESHNESS_HOURS } = require("./scoring-constants")

const OUTLET_SEPARATOR = " - "

const MIN_HEADLINE_LENGTH = 20

function stripHtml(value) {
  return String(value ?? "").replace(/<[^>]*>/g, " ")
}

function toArray(value) {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function textOf(value) {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && typeof value._ === "string") return value._
  return String(value)
}

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
