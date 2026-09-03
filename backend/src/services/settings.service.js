"use strict"

const { prisma } = require("../lib/prisma")
const { env } = require("../lib/env")
const { logger } = require("../utils/logger")

const SETTINGS_ID = "singleton"

// Env vars stay the fallback so a deployment keeps working before anyone has
// opened the settings page. Once a value is saved it wins.
function defaults() {
  return {
    id: SETTINGS_ID,
    heygenAvatarGroupId: null,
    heygenAvatarLookId: env.HEYGEN_AVATAR_ID ?? null,
    heygenAvatarEngine: "avatar_iv",
    heygenVoiceId: env.HEYGEN_VOICE_ID ?? null,
    heygenVoiceSpeed: 1.0,
    heygenVoiceLocale: "en-US",
    openaiModel: env.OPENAI_MODEL,
    openaiReasoningEffort: null,
    openaiSendTemperature: false,
    openaiTemperature: 0.5,
    targetWordsMin: 75,
    targetWordsMax: 90,
  }
}

let cached = null
let warnedMissingTable = false

// P2021 is "table does not exist". Generation worked off env vars before this
// table existed, so a pending migration falls back to those rather than taking
// the whole pipeline down.
function isMissingTable(error) {
  return error?.code === "P2021"
}

async function getSettings() {
  if (cached) return cached

  let existing = null
  try {
    existing = await prisma.appSettings.findUnique({
      where: { id: SETTINGS_ID },
    })
  } catch (error) {
    if (!isMissingTable(error)) throw error

    if (!warnedMissingTable) {
      warnedMissingTable = true
      logger.warn(
        "AppSettings table is missing — using environment defaults. Run `npx prisma db push` to enable the settings page."
      )
    }
    return defaults()
  }

  cached = existing ?? defaults()
  return cached
}

async function updateSettings(patch) {
  const base = defaults()

  const saved = await prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { ...base, ...patch },
    update: patch,
  })

  cached = saved
  return saved
}

// The pipeline reads settings on every run, so a save must not require a
// restart to take effect.
function invalidate() {
  cached = null
}

module.exports = { getSettings, updateSettings, invalidate, defaults, SETTINGS_ID }
