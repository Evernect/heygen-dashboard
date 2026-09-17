"use strict"

const { logger } = require("../../utils/logger")

const TIMEOUT_MS = 20000

const INTERVAL_MS = 1200

const USER_AGENT =
  "Mozilla/5.0 (compatible; ReelflowNewsBot/1.0; +https://github.com/reelflow)"

const RETRYABLE_STATUSES = new Set([429, 503])
const DEFAULT_RETRY_AFTER_MS = 5000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function retryAfterMs(response) {
  const header = response.headers?.get?.("retry-after")
  if (!header) return DEFAULT_RETRY_AFTER_MS

  const seconds = Number(header)
  if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30000)

  const date = Date.parse(header)
  if (!Number.isNaN(date)) {
    return Math.min(Math.max(date - Date.now(), 0), 30000)
  }

  return DEFAULT_RETRY_AFTER_MS
}

async function fetchOnce(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  return response
}

async function fetchFeed(url) {
  try {
    let response = await fetchOnce(url)

    if (RETRYABLE_STATUSES.has(response.status)) {
      const wait = retryAfterMs(response)
      logger.warn(`Feed ${response.status} from ${url}; retrying in ${wait}ms`)
      await sleep(wait)
      response = await fetchOnce(url)
    }

    if (!response.ok) {
      return { error: `HTTP ${response.status}` }
    }

    return { xml: await response.text() }
  } catch (error) {
    return { error: error.name === "TimeoutError" ? "timed out" : error.message }
  }
}

async function fetchFeeds(requests) {
  const results = []

  for (const [index, request] of (requests ?? []).entries()) {
    if (index > 0) await sleep(INTERVAL_MS)

    const outcome = await fetchFeed(request.url)
    if (outcome.error) {
      logger.warn(
        `Feed failed for ${request.keyword?.keywordId ?? "?"}: ${outcome.error}`
      )
    }

    results.push({ ...request, ...outcome })
  }

  return results
}

module.exports = { fetchFeed, fetchFeeds, retryAfterMs, INTERVAL_MS, TIMEOUT_MS }
