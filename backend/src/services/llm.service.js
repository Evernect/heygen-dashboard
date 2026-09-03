"use strict"

const OpenAI = require("openai")

const { requireEnv } = require("../lib/env")
const { getSettings } = require("./settings.service")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")
const {
  buildScriptGenerationPrompt,
  buildScriptOutputSchema,
} = require("./prompts/script-generation.prompt")

let client = null

function getClient() {
  if (!client) {
    const [apiKey] = requireEnv("OPENAI_API_KEY")
    client = new OpenAI({ apiKey })
  }
  return client
}

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

// Which sampling and reasoning parameters a model accepts moves with every
// release, and asking for an unsupported one is a hard 400 rather than a
// warning. Rather than pin a capability table that silently goes stale, send
// what the settings ask for and drop the rejected parameter on the retry.
const UNSUPPORTED_PARAM = /Unsupported (parameter|value): '?(\w+)/i

function rejectedParameter(error) {
  const message = error?.message ?? ""
  if (error?.status !== 400) return null

  const match = message.match(UNSUPPORTED_PARAM)
  if (match) return match[2]

  if (/temperature/i.test(message)) return "temperature"
  if (/reasoning/i.test(message)) return "reasoning"
  return null
}

async function createWithFallback(openai, request) {
  try {
    return await openai.responses.create(request)
  } catch (error) {
    const rejected = rejectedParameter(error)

    if (rejected === "temperature" && "temperature" in request) {
      logger.warn(
        `${request.model} rejected temperature; retrying without it. Turn it off in Settings to skip this round trip.`
      )
      const { temperature, ...rest } = request
      return openai.responses.create(rest)
    }

    if (rejected === "reasoning" && "reasoning" in request) {
      logger.warn(
        `${request.model} rejected reasoning.effort; retrying without it.`
      )
      const { reasoning, ...rest } = request
      return openai.responses.create(rest)
    }

    throw error
  }
}

// Generates a script plus per-platform captions for one topic.
async function generateScript({ issue, angle }) {
  const openai = getClient()
  const settings = await getSettings()

  const wordsMin = settings.targetWordsMin
  const wordsMax = settings.targetWordsMax

  const prompt = buildScriptGenerationPrompt({
    issue,
    angle,
    wordsMin,
    wordsMax,
  })

  logger.info(
    `Generating script with ${settings.openaiModel} (${wordsMin}-${wordsMax} words) for issue: ${issue.slice(0, 80)}`
  )

  const request = {
    model: settings.openaiModel,
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "video_script",
        strict: true,
        schema: buildScriptOutputSchema({ wordsMin, wordsMax }),
      },
    },
  }

  if (settings.openaiSendTemperature) {
    request.temperature = settings.openaiTemperature
  }

  if (settings.openaiReasoningEffort) {
    request.reasoning = { effort: settings.openaiReasoningEffort }
  }

  let response
  try {
    response = await createWithFallback(openai, request)
  } catch (error) {
    logger.error("OpenAI request failed", error)
    throw new HttpError(
      502,
      `Script generation failed: ${error.message ?? "unknown OpenAI error"}`
    )
  }

  const content = response.output_text
  if (!content) {
    throw new HttpError(502, "Script generation returned an empty response")
  }

  let output
  try {
    output = JSON.parse(content)
  } catch {
    throw new HttpError(502, "Script generation returned malformed JSON")
  }

  return {
    title: output.title,
    scriptText: output.script,
    facebookCaption: output.facebook_caption ?? null,
    instagramCaption: output.instagram_caption ?? null,
    youtubeCaption: output.youtube_caption ?? null,
    tiktokCaption: output.tiktok_caption ?? null,
    xPostText: output.x_post_text ?? null,
    hashtags: Array.isArray(output.hashtags) ? output.hashtags : [],
    targetPlatforms: toPlatformEnum(output.platforms),
  }
}

// GET /v1/models, narrowed to the text models worth picking for generation.
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

module.exports = { generateScript, listModels, rejectedParameter }
