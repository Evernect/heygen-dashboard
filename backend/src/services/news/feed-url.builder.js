"use strict"

const { parseQuery, withDefaultWindow } = require("./keyword-rules")

const GOOGLE_NEWS_LOCALE = "hl=en-US&gl=US&ceid=US:en"

function buildFeedUrl(keyword) {
  const { kind, body } = parseQuery(keyword?.query)
  if (!body) return null

  if (kind === "rss") return body

  if (kind === "geo") {
    return `https://news.google.com/rss/headlines/section/geo/${encodeURIComponent(body)}?${GOOGLE_NEWS_LOCALE}`
  }

  // X rows are searched elsewhere, never sent to Google News.
  if (kind === "x") return null

  return `https://news.google.com/rss/search?q=${encodeURIComponent(withDefaultWindow(body))}&${GOOGLE_NEWS_LOCALE}`
}

function buildFeedRequests(keywords) {
  const requests = []

  for (const keyword of keywords ?? []) {
    if (!keyword?.active) continue

    const url = buildFeedUrl(keyword)
    if (!url) continue

    requests.push({ keyword, url })
  }

  return requests
}

module.exports = { buildFeedUrl, buildFeedRequests }
