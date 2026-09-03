"use strict"

const { env, requireEnv } = require("../lib/env")
const { getSettings } = require("./settings.service")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")

const API_BASE = "https://api.heygen.com/v3"

// A short, freely-licensed sample used when DRY_RUN_HEYGEN is on
const DRY_RUN_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

const DRY_RUN_POLLS_BEFORE_READY = 1
const dryRunPollCounts = new Map()

function withQuery(path, query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

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

// GET /v3/avatars — characters. Each group holds one or more looks.
async function listAvatarGroups({ ownership, limit = 50, token } = {}) {
  const body = await heygenFetch(
    withQuery("/avatars", { ownership, limit, token })
  )
  const data = body?.data ?? {}

  return {
    items: (data.avatars ?? data.groups ?? data.items ?? []).map((group) => ({
      id: group.id,
      name: group.name,
      gender: group.gender ?? null,
      looksCount: group.looks_count ?? null,
      previewImageUrl: group.preview_image_url ?? null,
      defaultVoiceId: group.default_voice_id ?? null,
    })),
    hasMore: Boolean(data.has_more),
    nextToken: data.next_token ?? null,
  }
}

// GET /v3/avatars/looks — the look `id` is what POST /v3/videos wants as
// `avatar_id`; a group id is rejected.
async function listAvatarLooks({ groupId, ownership, limit = 50, token } = {}) {
  const body = await heygenFetch(
    withQuery("/avatars/looks", {
      group_id: groupId,
      ownership,
      limit,
      token,
    })
  )
  const data = body?.data ?? {}

  return {
    items: (data.looks ?? data.items ?? []).map((look) => ({
      id: look.id,
      name: look.name,
      groupId: look.group_id ?? null,
      avatarType: look.avatar_type ?? null,
      gender: look.gender ?? null,
      previewImageUrl: look.preview_image_url ?? null,
      defaultVoiceId: look.default_voice_id ?? null,
      // Requesting an engine missing from this list is a 400, so the UI only
      // offers what the selected look actually accepts.
      supportedEngines: look.supported_api_engines ?? [],
      preferredOrientation: look.preferred_orientation ?? null,
    })),
    hasMore: Boolean(data.has_more),
    nextToken: data.next_token ?? null,
  }
}

// GET /v3/voices
async function listVoices({ language, gender, type, limit = 100, token } = {}) {
  const body = await heygenFetch(
    withQuery("/voices", { language, gender, type, limit, token })
  )
  const data = body?.data ?? {}

  return {
    items: (data.voices ?? data.items ?? []).map((voice) => ({
      id: voice.voice_id,
      name: voice.name,
      language: voice.language ?? null,
      gender: voice.gender ?? null,
      previewAudioUrl: voice.preview_audio_url ?? null,
      // The generation prompt emits SSML <break/> tags, so a voice without
      // pause support would read them aloud or drop the pacing entirely.
      supportsPause: Boolean(voice.support_pause),
      supportsLocale: Boolean(voice.support_locale),
      type: voice.type ?? null,
    })),
    hasMore: Boolean(data.has_more),
    nextToken: data.next_token ?? null,
  }
}

// Submits one render
async function createVideo({ title, scriptText }) {
  if (env.DRY_RUN_HEYGEN) {
    const videoId = `dryrun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    logger.warn(`[dry-run] Pretending to create HeyGen video ${videoId}`)
    return videoId
  }

  const settings = await getSettings()

  const avatarId = settings.heygenAvatarLookId
  const voiceId = settings.heygenVoiceId

  if (!avatarId || !voiceId) {
    throw new HttpError(
      400,
      "No HeyGen avatar or voice is configured. Pick one on the Settings page."
    )
  }

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
      engine: { type: settings.heygenAvatarEngine },
      caption: { style: "default", file_format: "srt" },
      voice_settings: {
        // The API types this as a number in 0.5-1.5; a string is rejected.
        speed: settings.heygenVoiceSpeed,
        locale: settings.heygenVoiceLocale,
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

module.exports = {
  createVideo,
  getVideoStatus,
  downloadVideo,
  listAvatarGroups,
  listAvatarLooks,
  listVoices,
}
