"use strict"

const { ASS_COLOUR_RE } = require("./caption-constants")
const { runStructured } = require("../openai-client")
const {
  HIGHLIGHT_COLOUR_SYSTEM_PROMPT,
  MAX_HIGHLIGHTS,
  buildHighlightColourPrompt,
  buildHighlightColourSchema,
} = require("../prompts/highlight-colour.prompt")
const { logger } = require("../../utils/logger")

const WEB_SEARCH_TOOL = [{ type: "web_search" }]

const SSML_TAG = /<[^>]*>/g

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function occursInScript(word, scriptText) {
  return new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(scriptText)
}

function sanitiseHighlights(raw, scriptText) {
  const plainScript = scriptText.replace(SSML_TAG, " ")

  const candidates = (Array.isArray(raw) ? raw : [])
    .map((entry) => ({
      word: typeof entry?.word === "string" ? entry.word.trim() : "",
      colour: typeof entry?.colour === "string" ? entry.colour.trim() : "",
    }))
    .filter((entry) => entry.word && entry.word.length <= 60)

  const colour = candidates.find((entry) => ASS_COLOUR_RE.test(entry.colour))?.colour
  if (!colour) {
    if (candidates.length) {
      logger.warn(
        "Highlight agent returned no usable ASS colour; rendering without highlights"
      )
    }
    return []
  }

  const seen = new Set()
  const highlights = []

  for (const candidate of candidates) {
    const key = candidate.word.toLowerCase()
    if (seen.has(key)) continue
    if (!occursInScript(candidate.word, plainScript)) {
      logger.warn(`Highlight agent picked "${candidate.word}", which is not in the script`)
      continue
    }

    seen.add(key)
    highlights.push({ word: candidate.word, colour })

    if (highlights.length === MAX_HIGHLIGHTS) break
  }

  return highlights
}

async function request({ userId, scriptText, tools }) {
  const response = await runStructured({
    userId,
    prompt: buildHighlightColourPrompt(scriptText),
    instructions: HIGHLIGHT_COLOUR_SYSTEM_PROMPT,
    tools,
    schemaName: "caption_highlights",
    schema: buildHighlightColourSchema(),
    label: "Caption highlight selection",
  })

  return response?.highlights
}

async function selectHighlights({ userId, scriptText }) {
  if (!scriptText?.trim()) return []

  try {
    return sanitiseHighlights(
      await request({ userId, scriptText, tools: WEB_SEARCH_TOOL }),
      scriptText
    )
  } catch (error) {
    logger.warn(
      `Highlight agent failed with web search (${error.message}); retrying without it`
    )
  }

  try {
    return sanitiseHighlights(await request({ userId, scriptText }), scriptText)
  } catch (error) {
    logger.warn(
      `Highlight agent failed (${error.message}); burning captions without highlights`
    )
    return []
  }
}

module.exports = { sanitiseHighlights, selectHighlights }
