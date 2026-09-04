"use strict"

const { prisma } = require("../lib/prisma")
const { env } = require("../lib/env")
const { logger } = require("../utils/logger")

const SETTINGS_ID = "singleton"

function defaults() {
  return {
    id: SETTINGS_ID,
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

function invalidate() {
  cached = null
}

module.exports = { getSettings, updateSettings, invalidate, defaults, SETTINGS_ID }
