"use strict"

const { getClient, runStructured } = require("./openai-client")
const { getSettings } = require("./settings.service")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")
const {
  buildScriptGenerationPrompt,
  buildScriptOutputSchema,
  variantKeys,
} = require("./prompts/script-generation.prompt")

const SCRIPT_VARIANT_COUNT = 3

function toPlatformEnum(platforms) {
  const allowed = new Set([
    "FACEBOOK",
    "INSTAGRAM",
    "YOUTUBE",
    "TIKTOK",
    "X",
  ])

  return [
    ...new Set(
      (platforms ?? [])
        .map((platform) => String(platform).trim().toUpperCase())
        .filter((platform) => allowed.has(platform))
    ),
  ]
}

function toScriptRecord(variant, index) {
  return {
    variantIndex: index,
    variantLabel: variant.label?.trim() || null,
    title: variant.title,
    scriptText: variant.script,
    facebookCaption: variant.facebook_caption ?? null,
    instagramCaption: variant.instagram_caption ?? null,
    youtubeCaption: variant.youtube_caption ?? null,
    tiktokCaption: variant.tiktok_caption ?? null,
    xPostText: variant.x_post_text ?? null,
    hashtags: Array.isArray(variant.hashtags) ? variant.hashtags : [],
    targetPlatforms: toPlatformEnum(variant.platforms),
  }
}

async function generateScriptVariants({
  issue,
  angle,
  variantCount = SCRIPT_VARIANT_COUNT,
  userId,
}) {
  const settings = await getSettings(userId)

  const wordsMin = settings.targetWordsMin
  const wordsMax = settings.targetWordsMax

  const prompt = buildScriptGenerationPrompt({
    issue,
    angle,
    wordsMin,
    wordsMax,
    variantCount,
  })

  logger.info(
    `Generating ${variantCount} scripts with ${settings.openaiModel} (${wordsMin}-${wordsMax} words) for issue: ${issue.slice(0, 80)}`
  )

  const output = await runStructured({
    userId,
    settings,
    prompt,
    schemaName: "video_scripts",
    schema: buildScriptOutputSchema({ wordsMin, wordsMax, variantCount }),
    label: "Script generation",
  })

  const variants = variantKeys(variantCount)
    .map((key) => output[key])
    .filter((variant) => variant?.title && variant?.script)

  if (variants.length === 0) {
    throw new HttpError(502, "Script generation returned no usable scripts")
  }

  if (variants.length < variantCount) {
    logger.warn(
      `Model returned ${variants.length} of ${variantCount} requested scripts`
    )
  }

  return variants.map(toScriptRecord)
}

async function listModels() {
  const openai = getClient()
  const page = await openai.models.list()

  return page.data
    .filter((model) => /^(gpt|o\d)/.test(model.id))
    .filter(
      (model) =>
        !/(audio|realtime|transcribe|tts|image|embedding|moderation|search|dall-e|codex)/.test(
          model.id
        )
    )
    .map((model) => ({ id: model.id, created: model.created ?? null }))
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0) || a.id.localeCompare(b.id))
}

module.exports = {
  generateScriptVariants,
  listModels,
  SCRIPT_VARIANT_COUNT,
}
