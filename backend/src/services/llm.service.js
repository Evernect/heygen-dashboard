"use strict"

const OpenAI = require("openai")

const { env, requireEnv } = require("../lib/env")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")
const {
  buildScriptGenerationPrompt,
  SCRIPT_OUTPUT_SCHEMA,
} = require("./prompts/script-generation.prompt")

let client = null

function getClient() {
  if (!client) {
    const [apiKey] = requireEnv("OPENAI_API_KEY")
    client = new OpenAI({ apiKey })
  }
  return client
}

// Maps the model's lowercase platform strings onto the Platform enum
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

// Generates a script plus per-platform captions for one topic.
async function generateScript({ issue, angle }) {
  const openai = getClient()
  const prompt = buildScriptGenerationPrompt({ issue, angle })

  logger.info(`Generating script for issue: ${issue.slice(0, 80)}`)

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "video_script",
          strict: true,
          schema: SCRIPT_OUTPUT_SCHEMA,
        },
      },
    })
  } catch (error) {
    logger.error("OpenAI request failed", error)
    throw new HttpError(
      502,
      `Script generation failed: ${error.message ?? "unknown OpenAI error"}`
    )
  }

  const content = completion.choices?.[0]?.message?.content
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

module.exports = { generateScript }
