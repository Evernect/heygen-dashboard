"use strict"

const { z } = require("zod")

const heygen = require("../services/heygen.service")
const llm = require("../services/llm.service")
const { getSettings, updateSettings } = require("../services/settings.service")

const HEYGEN_ENGINES = ["avatar_iii", "avatar_iv", "avatar_v"]

const REASONING_EFFORTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max"]

const MAX_WORDS = 400

const updateSettingsSchema = z
  .object({
    heygenAvatarGroupId: z.string().trim().min(1).nullable(),
    heygenAvatarLookId: z.string().trim().min(1).nullable(),
    heygenAvatarEngine: z.enum(HEYGEN_ENGINES),
    heygenVoiceSpeed: z.number().min(0.5).max(1.5),
    heygenVoiceLocale: z.string().trim().min(2).max(10),

    openaiModel: z.string().trim().min(1),
    openaiReasoningEffort: z.enum(REASONING_EFFORTS).nullable(),
    openaiSendTemperature: z.boolean(),
    openaiTemperature: z.number().min(0).max(2),

    targetWordsMin: z.number().int().min(10).max(MAX_WORDS),
    targetWordsMax: z.number().int().min(10).max(MAX_WORDS),
  })
  .partial()
  .refine(
    (value) =>
      value.targetWordsMin === undefined ||
      value.targetWordsMax === undefined ||
      value.targetWordsMin <= value.targetWordsMax,
    {
      message: "Minimum words must be less than or equal to maximum words",
      path: ["targetWordsMin"],
    }
  )

const heygenListQuerySchema = z.object({
  ownership: z.enum(["public", "private"]).optional(),
  groupId: z.string().trim().min(1).optional(),
  token: z.string().trim().min(1).optional(),
  // HeyGen caps both avatar endpoints at 50 per page and 400s above it.
  limit: z.coerce.number().int().min(1).max(50).optional(),
})

async function readSettings(req, res) {
  const settings = await getSettings(req.user.id)

  res.json({
    settings,
    options: {
      heygenEngines: HEYGEN_ENGINES,
      reasoningEfforts: REASONING_EFFORTS,
    },
  })
}

async function writeSettings(req, res) {
  const current = await getSettings(req.user.id)
  const merged = { ...current, ...req.body }

  if (merged.targetWordsMin > merged.targetWordsMax) {
    return res.status(400).json({
      message: "Validation failed",
      details: [
        {
          field: "targetWordsMin",
          message: "Minimum words must be less than or equal to maximum words",
        },
      ],
    })
  }

  const settings = await updateSettings(req.user.id, req.body)
  res.json({ settings })
}

async function listAvatarGroups(req, res) {
  const query = req.validatedQuery ?? {}
  res.json(
    await heygen.listAvatarGroups({
      ownership: query.ownership,
      limit: query.limit,
      token: query.token,
      userId: req.user?.id,
    })
  )
}

async function listAvatarLooks(req, res) {
  const query = req.validatedQuery ?? {}
  res.json(
    await heygen.listAvatarLooks({
      groupId: query.groupId,
      ownership: query.ownership,
      limit: query.limit,
      token: query.token,
      userId: req.user?.id,
    })
  )
}

async function listOpenAiModels(req, res) {
  res.json({ items: await llm.listModels() })
}

module.exports = {
  readSettings,
  writeSettings,
  listAvatarGroups,
  listAvatarLooks,
  listOpenAiModels,
  schemas: { updateSettingsSchema, heygenListQuerySchema },
}
