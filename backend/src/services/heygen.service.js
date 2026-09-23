"use strict"

const { resolveApiKey } = require("./heygen-credentials.service")
const { getSettings } = require("./settings.service")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")

const API_BASE = "https://api.heygen.com/v3"

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
    previewVideoUrl: look.preview_video_url ?? null,
    supportedEngines: look.supported_api_engines ?? [],
    preferredOrientation: look.preferred_orientation ?? null,
    status: look.status ?? null,
  }
}

async function listAvatarGroups({ ownership, limit = 50, token, userId } = {}) {
  const body = await heygenFetch(
    withQuery("/avatars", { ownership, limit, token }),
    {},
    await resolveApiKey(userId)
  )

  return toPage(body, mapGroup)
}

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

async function createVideo({ title, scriptText, userId }) {
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
        aspect_ratio: "auto",
        resolution: "720p",
        engine: { type: settings.heygenAvatarEngine },
        caption: { file_format: "srt" },
        voice_settings: {
          speed: settings.heygenVoiceSpeed,
          locale: settings.heygenVoiceLocale,
          engine_settings: {
            engine_type: "elevenlabs",
            model: "eleven_flash_v2_5",
          },
        },
        motion_prompt:
          "Natural hand gestures while speaking, but subtle and minimal - avoid large or exaggerated hand movements",
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
  const body = await heygenFetch(`/videos/${videoId}`, {}, await resolveApiKey(userId))
  const data = body?.data ?? {}

  if (data.status === "completed") {
    return {
      status: "completed",
      videoUrl: data.video_url,
      subtitleUrl: data.subtitle_url ?? null,
    }
  }

  if (data.status === "failed") {
    return {
      status: "failed",
      error: data.error?.message ?? "HeyGen reported the render failed",
    }
  }

  return { status: "processing" }
}

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

async function downloadSubtitles(subtitleUrl) {
  const response = await fetch(subtitleUrl)

  if (!response.ok) {
    throw new HttpError(
      502,
      `Could not download the caption file: HTTP ${response.status}`
    )
  }

  return response.text()
}

module.exports = {
  fetchAccount,
  createVideo,
  getVideoStatus,
  downloadVideo,
  downloadSubtitles,
  listAvatarGroups,
  listAvatarLooks,
}
