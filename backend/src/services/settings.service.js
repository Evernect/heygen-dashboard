"use strict"

const { prisma } = require("../lib/prisma")
const { env } = require("../lib/env")
const { logger } = require("../utils/logger")

function defaults() {
  return {
    heygenAvatarGroupId: null,
    heygenAvatarLookId: env.HEYGEN_AVATAR_ID ?? null,
    heygenAvatarEngine: "avatar_iv",
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

const cache = new Map()
let warnedMissingTable = false

function isMissingTable(error) {
  return error?.code === "P2021"
}

async function getSettings(userId) {
  if (!userId) return { userId: null, ...defaults() }

  const cached = cache.get(userId)
  if (cached) return cached

  let existing = null
  try {
    existing = await prisma.appSettings.findUnique({ where: { userId } })
  } catch (error) {
    if (!isMissingTable(error)) throw error

    if (!warnedMissingTable) {
      warnedMissingTable = true
      logger.warn(
        "AppSettings table is missing — using environment defaults. Run `npx prisma db push` to enable the settings page."
      )
    }
    return { userId, ...defaults() }
  }

  const settings = existing ?? { userId, ...defaults() }
  cache.set(userId, settings)

  return settings
}

async function updateSettings(userId, patch) {
  const saved = await prisma.appSettings.upsert({
    where: { userId },
    create: { userId, ...defaults(), ...patch },
    update: patch,
  })

  cache.set(userId, saved)
  return saved
}

function invalidate(userId) {
  if (userId) cache.delete(userId)
  else cache.clear()
}

module.exports = { getSettings, updateSettings, invalidate, defaults }
