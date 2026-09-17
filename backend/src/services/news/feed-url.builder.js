"use strict"

const GOOGLE_NEWS_LOCALE = "hl=en-US&gl=US&ceid=US:en"

/**
 * One feed URL for one keyword row.
 *
 * The `query` column carries its own routing:
 *   RSS:<url>    a publisher's own feed, used verbatim — these give real
 *                article links rather than Google News redirect wrappers
 *   GEO:<place>  Google News' feed for a place
 *   anything else  a Google News keyword search
 *
 * Returns null for a row with nothing to fetch, which the caller skips.
 */
function buildFeedUrl(keyword) {
  const query = String(keyword?.query ?? "").trim()
  if (!query) return null

  if (query.startsWith("RSS:")) {
    const url = query.slice(4).trim()
    return url || null
  }

  if (query.startsWith("GEO:")) {
    const place = query.slice(4).trim()
    if (!place) return null
    return `https://news.google.com/rss/headlines/section/geo/${encodeURIComponent(place)}?${GOOGLE_NEWS_LOCALE}`
  }

  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${GOOGLE_NEWS_LOCALE}`
}

/**
 * The active keywords paired with the URL each one should fetch. Inactive rows
 * and rows with an unusable query drop out here rather than later.
 */
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
