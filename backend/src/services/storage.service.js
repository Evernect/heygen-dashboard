"use strict"

const { createClient } = require("@supabase/supabase-js")

const { env, requireEnv } = require("../lib/env")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")

let client = null

function getClient() {
  if (!client) {
    const [url, key] = requireEnv("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

// Re-hosts a rendered video on Supabase Storage and returns a public URL
async function uploadVideo({ scriptId, title, buffer }) {
  const supabase = getClient()
  const bucket = env.SUPABASE_STORAGE_BUCKET
  const path = `${scriptId}/${slugify(title) || "video"}.mp4`

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "video/mp4",
    // Retrying a failed publish re-uses the same path.
    upsert: true,
  })

  if (error) {
    throw new HttpError(
      502,
      `Could not upload video to Supabase Storage: ${error.message}`
    )
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path)

  logger.info(`Uploaded video for script ${scriptId} -> ${publicUrl}`)
  return publicUrl
}

module.exports = { uploadVideo }
