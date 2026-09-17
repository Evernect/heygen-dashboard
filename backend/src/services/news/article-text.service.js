"use strict"

const { env } = require("../../lib/env")
const { logger } = require("../../utils/logger")

const READER_BASE = "https://r.jina.ai/"
const TIMEOUT_MS = 25000
const INTERVAL_MS = 1500

const MIN_USABLE_LENGTH = 200

const MAX_LENGTH = 2500

const ERROR_MARKERS = [
  "AbuseAlleviationError",
  "Warning: Target URL returned error",
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function isUsable(text) {
  if (!text || text.length < MIN_USABLE_LENGTH) return false
  return !ERROR_MARKERS.some((marker) => text.includes(marker))
}

async function fetchArticleText(url) {
  if (!url) return null

  const headers = { Accept: "text/plain" }
  if (env.JINA_API_KEY) {
    headers.Authorization = `Bearer ${env.JINA_API_KEY}`
  }

  try {
    const response = await fetch(`${READER_BASE}${url}`, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) return null

    const text = (await response.text()).trim()
    return isUsable(text) ? text.slice(0, MAX_LENGTH) : null
  } catch (error) {
    logger.warn(`Article fetch failed for ${url}: ${error.message}`)
    return null
  }
}

async function fetchArticleTexts(clusters) {
  if (!env.JINA_API_KEY) {
    logger.warn(
      "JINA_API_KEY is not set — summaries will be drawn from headlines alone"
    )
    return (clusters ?? []).map(() => null)
  }

  const texts = []

  for (const [index, cluster] of (clusters ?? []).entries()) {
    if (index > 0) await sleep(INTERVAL_MS)
    texts.push(await fetchArticleText(cluster.urls?.[0]))
  }

  return texts
}

module.exports = {
  fetchArticleText,
  fetchArticleTexts,
  isUsable,
  MIN_USABLE_LENGTH,
  MAX_LENGTH,
}
