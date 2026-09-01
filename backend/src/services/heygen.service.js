"use strict"

const { env, requireEnv } = require("../lib/env")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")

const API_BASE = "https://api.heygen.com/v3"

// A short, freely-licensed sample used when DRY_RUN_HEYGEN is on
const DRY_RUN_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

const DRY_RUN_POLLS_BEFORE_READY = 1
const dryRunPollCounts = new Map()

async function heygenFetch(path, options = {}) {
  const [apiKey] = requireEnv("HEYGEN_API_KEY")

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      body?.error?.message ?? body?.message ?? `HTTP ${response.status}`
    throw new HttpError(502, `HeyGen request failed: ${message}`)
  }

  return body
}

// Submits one render
async function createVideo({ title, scriptText }) {
  if (env.DRY_RUN_HEYGEN) {
    const videoId = `dryrun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    logger.warn(`[dry-run] Pretending to create HeyGen video ${videoId}`)
    return videoId
  }

  const [avatarId, voiceId] = requireEnv("HEYGEN_AVATAR_ID", "HEYGEN_VOICE_ID")

  const body = await heygenFetch("/videos", {
    method: "POST",
    body: JSON.stringify({
      type: "avatar",
      title,
      avatar_id: avatarId,
      script: scriptText,
      voice_id: voiceId,
      aspect_ratio: "9:16",
      resolution: "1080p",
      engine: { type: "avatar_v" },
      caption: { style: "default", file_format: "srt" },
      voice_settings: {
        speed: "1.2",
        locale: "en-US",
        engine_settings: {
          engine_type: "elevenlabs",
          model: "eleven_flash_v2_5",
        },
      },
      motion_prompt:
        "Give me a calm, serious expression. Minimal smiling. No head movement. The overall movement should not be weird.",
    }),
  })

  const videoId = body?.data?.video_id
  if (!videoId) {
    throw new HttpError(502, "HeyGen did not return a video id")
  }

  logger.info(`HeyGen render submitted: ${videoId}`)
  return videoId
}

async function getVideoStatus(videoId) {
  if (env.DRY_RUN_HEYGEN) {
    const polls = (dryRunPollCounts.get(videoId) ?? 0) + 1
    dryRunPollCounts.set(videoId, polls)

    if (polls <= DRY_RUN_POLLS_BEFORE_READY) {
      logger.warn(`[dry-run] HeyGen ${videoId} still "rendering" (poll ${polls})`)
      return { status: "processing" }
    }

    dryRunPollCounts.delete(videoId)
    logger.warn(`[dry-run] HeyGen ${videoId} "completed"`)
    return { status: "completed", videoUrl: DRY_RUN_VIDEO_URL }
  }

  const body = await heygenFetch(`/videos/${videoId}`)
  const data = body?.data ?? {}

  if (data.status === "completed") {
    return { status: "completed", videoUrl: data.video_url }
  }

  if (data.status === "failed") {
    return {
      status: "failed",
      error: data.error?.message ?? "HeyGen reported the render failed",
    }
  }

  return { status: "processing" }
}

// Downloads the finished render so it can be re-hosted on Supabase Storage
async function downloadVideo(videoUrl) {
  const response = await fetch(videoUrl)

  if (!response.ok) {
    throw new HttpError(
      502,
      `Could not download rendered video: HTTP ${response.status}`
    )
  }

  return Buffer.from(await response.arrayBuffer())
}

module.exports = { createVideo, getVideoStatus, downloadVideo }
