"use strict"

const { logger } = require("../../utils/logger")

const TIMEOUT_MS = 20000

/**
 * Spacing between feed requests.
 *
 * Google News rate-limits an impatient client hard, and the whole run is
 * scheduled work with nobody waiting on it, so the requests go out one at a
 * time with a gap. Parallelising this is the fastest way to start getting 429s.
 */
const INTERVAL_MS = 1200

/** Google News serves unreliable results to clients with no user agent. */
const USER_AGENT =
  "Mozilla/5.0 (compatible; ReelflowNewsBot/1.0; +https://github.com/reelflow)"

const RETRYABLE_STATUSES = new Set([429, 503])
const DEFAULT_RETRY_AFTER_MS = 5000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** `Retry-After` is either seconds or an HTTP date. */
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

/**
 * Fetches one feed, retrying once if the far end asked us to wait.
 *
 * Never throws: a failure is returned as `{ error }` so the caller can count it
 * and carry on with the other feeds.
 */
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

/**
 * Fetches every feed in turn and returns one result per request, in the order
 * they were given.
 */
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
