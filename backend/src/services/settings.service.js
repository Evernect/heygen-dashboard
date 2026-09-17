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

// One entry per user. A tenant that never signs in costs nothing, and a write
// only ever evicts its own author's entry.
const cache = new Map()
let warnedMissingTable = false

function isMissingTable(error) {
  return error?.code === "P2021"
}

/**
 * The settings a piece of work should run with.
 *
 * A user who has never opened the Settings page has no row yet and gets the
 * environment defaults; the row is created the first time they save one.
 *
 * `userId` is only ever null for a caller with no identity at all, which the
 * per-user routes now reject — background work reads the owner off the script
 * it is advancing.
 */
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

/** Drops one user's cached settings, or everybody's when given no id. */
function invalidate(userId) {
  if (userId) cache.delete(userId)
  else cache.clear()
}

module.exports = { getSettings, updateSettings, invalidate, defaults }
