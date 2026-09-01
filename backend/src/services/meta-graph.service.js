"use strict"

const { env, requireEnv } = require("../lib/env")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")

const GRAPH_VERSION = "v21.0"
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

// Instagram containers take ~30-60s to transcode before they can publish
const POLL_INTERVAL_MS = 5000
const MAX_POLL_ATTEMPTS = 24

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function graphRequest(path, { method = "GET", params = {}, token }) {
  const url = new URL(`${GRAPH_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }
  url.searchParams.set("access_token", token)

  const response = await fetch(url, { method })
  const body = await response.json().catch(() => null)

  if (!response.ok || body?.error) {
    const message =
      body?.error?.message ?? `HTTP ${response.status}`
    throw new HttpError(502, `Graph API error: ${message}`)
  }

  return body
}

function dryRunId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Publishes to a Facebook Page
async function publishToFacebook({ videoUrl, title, caption }) {
  if (env.DRY_RUN_META) {
    logger.warn(
      `[dry-run] Would publish to Facebook: "${title}" -> ${videoUrl}`
    )
    return dryRunId("dryrun-fb")
  }

  const [pageId, token] = requireEnv(
    "FACEBOOK_PAGE_ID",
    "FACEBOOK_PAGE_ACCESS_TOKEN"
  )

  const created = await graphRequest(`/${pageId}/videos`, {
    method: "POST",
    token,
    params: { file_url: videoUrl, title, description: caption ?? "" },
  })

  const videoId = created?.id
  if (!videoId) throw new HttpError(502, "Facebook did not return a video id")

  // Facebook accepts the upload immediately but processes asynchronously.
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS)

    const status = await graphRequest(`/${videoId}`, {
      token,
      params: { fields: "status" },
    })

    const videoStatus = status?.status?.video_status
    if (videoStatus === "ready") {
      logger.info(`Facebook video ${videoId} is live`)
      return videoId
    }
    if (videoStatus === "error") {
      throw new HttpError(502, "Facebook reported the video failed processing")
    }
  }

  // Processing usually finishes eventually; surface the id so it isn't lost.
  throw new HttpError(
    504,
    `Facebook video ${videoId} was still processing after ${
      (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000
    }s`
  )
}

// Publishes an Instagram Reel
async function publishToInstagram({ videoUrl, caption }) {
  if (env.DRY_RUN_META) {
    logger.warn(`[dry-run] Would publish Reel to Instagram -> ${videoUrl}`)
    return dryRunId("dryrun-ig")
  }

  const [accountId, token] = requireEnv(
    "INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "INSTAGRAM_ACCESS_TOKEN"
  )

  const container = await graphRequest(`/${accountId}/media`, {
    method: "POST",
    token,
    params: {
      media_type: "REELS",
      video_url: videoUrl,
      caption: caption ?? "",
      share_to_feed: "true",
    },
  })

  const containerId = container?.id
  if (!containerId) {
    throw new HttpError(502, "Instagram did not return a container id")
  }

  let ready = false
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await sleep(POLL_INTERVAL_MS)

    const status = await graphRequest(`/${containerId}`, {
      token,
      params: { fields: "status_code" },
    })

    if (status?.status_code === "FINISHED") {
      ready = true
      break
    }
    if (status?.status_code === "ERROR") {
      throw new HttpError(502, "Instagram failed to process the video")
    }
  }

  if (!ready) {
    throw new HttpError(
      504,
      `Instagram container ${containerId} was still processing after ${
        (MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000
      }s`
    )
  }

  const published = await graphRequest(`/${accountId}/media_publish`, {
    method: "POST",
    token,
    params: { creation_id: containerId },
  })

  const mediaId = published?.id
  if (!mediaId) {
    throw new HttpError(502, "Instagram did not return a published media id")
  }

  logger.info(`Instagram Reel ${mediaId} is live`)
  return mediaId
}

const PUBLISHERS = {
  FACEBOOK: publishToFacebook,
  INSTAGRAM: publishToInstagram,
}

function isSupported(platform) {
  return Object.hasOwn(PUBLISHERS, platform)
}

module.exports = {
  publishToFacebook,
  publishToInstagram,
  PUBLISHERS,
  isSupported,
}
