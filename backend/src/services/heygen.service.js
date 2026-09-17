"use strict"

const { env } = require("../lib/env")
const { resolveApiKey } = require("./heygen-credentials.service")
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

/**
 * One HeyGen call, authenticated with an explicit key. Callers either pass a
 * key they are verifying or resolve the signed-in user's stored one first —
 * nothing here reaches for a deployment-wide default on its own.
 */
async function heygenFetch(path, options = {}, apiKey) {
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

    // A rejected key is the caller's problem to fix, not an upstream outage,
    // so it must not be flattened into the generic 502 below.
    if (response.status === 401 || response.status === 403) {
      throw new HttpError(
        401,
        "HeyGen rejected the API key. Check it is copied in full and still active, then try again."
      )
    }

    throw new HttpError(502, `HeyGen request failed: ${message}`)
  }

  return body
}

/**
 * GET /v3/users/me — the cheapest authenticated call HeyGen offers, so it is
 * what proves a key is real before it is stored. A bad key comes back 401,
 * which `heygenFetch` has already turned into a message worth showing.
 */
async function fetchAccount(apiKey) {
  const body = await heygenFetch("/users/me", {}, apiKey)
  const data = body?.data ?? {}

  const firstName = data.first_name ?? ""
  const lastName = data.last_name ?? ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ")

  return {
    username: data.username ?? fullName ?? null,
    email: data.email ?? null,
  }
}

/**
 * Both avatar endpoints answer with `{ data: [...], has_more, next_token }` —
 * the array sits at the top level, and `next_token` only appears once there is
 * a further page to ask for.
 */
function toPage(body, mapItem) {
  return {
    items: (Array.isArray(body?.data) ? body.data : []).map(mapItem),
    hasMore: Boolean(body?.has_more),
    nextToken: body?.next_token ?? null,
  }
}

function mapGroup(group) {
  return {
    id: group.id,
    name: group.name,
    gender: group.gender ?? null,
    previewImageUrl: group.preview_image_url ?? null,
    previewVideoUrl: group.preview_video_url ?? null,
    looksCount: group.looks_count ?? 0,
    // Private groups report training progress; only `completed` can render.
    status: group.status ?? null,
  }
}

function mapLook(look) {
  return {
    id: look.id,
    name: look.name,
    groupId: look.group_id ?? null,
    avatarType: look.avatar_type ?? null,
    gender: look.gender ?? null,
    previewImageUrl: look.preview_image_url ?? null,
    // Photo avatars have no preview video, only an image.
    previewVideoUrl: look.preview_video_url ?? null,
    // Requesting an engine missing from this list is a 400, so the UI only
    // offers what the selected look actually accepts.
    supportedEngines: look.supported_api_engines ?? [],
    preferredOrientation: look.preferred_orientation ?? null,
    status: look.status ?? null,
  }
}

// GET /v3/avatars — the characters. Each one holds one or more looks.
async function listAvatarGroups({ ownership, limit = 50, token, userId } = {}) {
  const body = await heygenFetch(
    withQuery("/avatars", { ownership, limit, token }),
    {},
    await resolveApiKey(userId)
  )

  return toPage(body, mapGroup)
}

// GET /v3/avatars/looks — the look `id` is what POST /v3/videos wants as
// `avatar_id`. `groupId` narrows it to one character's wardrobe.
async function listAvatarLooks({
  groupId,
  ownership,
  limit = 50,
  token,
  userId,
} = {}) {
  const body = await heygenFetch(
    withQuery("/avatars/looks", {
      group_id: groupId,
      ownership,
      limit,
      token,
    }),
    {},
    await resolveApiKey(userId)
  )

  return toPage(body, mapLook)
}

// Submits one render
async function createVideo({ title, scriptText, userId }) {
  if (env.DRY_RUN_HEYGEN) {
    const videoId = `dryrun-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    logger.warn(`[dry-run] Pretending to create HeyGen video ${videoId}`)
    return videoId
  }

  const settings = await getSettings(userId)

  const avatarId = settings.heygenAvatarLookId

  if (!avatarId) {
    throw new HttpError(
      400,
      "No HeyGen avatar is configured. Pick one on the Settings page."
    )
  }

  const apiKey = await resolveApiKey(userId)

  const body = await heygenFetch(
    "/videos",
    {
      method: "POST",
      body: JSON.stringify({
        type: "avatar",
        title,
        avatar_id: avatarId,
        script: scriptText,
        // No voice_id: HeyGen then speaks with the avatar's own default
        // voice, which is the right one far more often than a hand-picked id.
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
    },
    apiKey
  )

  const videoId = body?.data?.video_id
  if (!videoId) {
    throw new HttpError(502, "HeyGen did not return a video id")
  }

  logger.info(`HeyGen render submitted: ${videoId}`)
  return videoId
}

async function getVideoStatus(videoId, { userId } = {}) {
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

  const body = await heygenFetch(`/videos/${videoId}`, {}, await resolveApiKey(userId))
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
  fetchAccount,
  createVideo,
  getVideoStatus,
  downloadVideo,
  listAvatarGroups,
  listAvatarLooks,
}
