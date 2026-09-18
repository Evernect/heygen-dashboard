"use strict"

const { runStructured } = require("../openai-client")
const {
  buildStyleTaggerPrompt,
  buildStyleTaggerSchema,
  HOOK_TYPES,
} = require("../prompts/style-tagger.prompt")
const { logger } = require("../../utils/logger")

const BREAK_TAG = /<break\s+time="([\d.]+)s"\s*\/>/gi
const SSML_TAG = /<[^>]*>/g

const SHORT_SENTENCE_WORDS = 6
const LONG_SENTENCE_WORDS = 12

const HOOK_FIRST_WORDS = 8

const TAG_BATCH_SIZE = 25

function countWords(text) {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

function parseBreaks(scriptText) {
  const durations = []

  for (const match of scriptText.matchAll(BREAK_TAG)) {
    const seconds = Number(match[1])
    if (Number.isFinite(seconds)) durations.push(seconds)
  }

  const breakCount = durations.length
  const avgBreakDuration = breakCount
    ? Number(
        (durations.reduce((sum, value) => sum + value, 0) / breakCount).toFixed(
          3
        )
      )
    : null

  return { breakCount, avgBreakDuration }
}

function toSentences(scriptText) {
  return scriptText
    .replace(BREAK_TAG, " ")
    .replace(SSML_TAG, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function findOutroLeadIn(sentences, candidateName) {
  if (sentences.length < 2) return null

  let closingIndex = sentences.length - 1

  if (candidateName) {
    const needle = candidateName.toLowerCase()
    const found = sentences.findLastIndex((sentence) =>
      sentence.toLowerCase().includes(needle)
    )
    if (found > 0) closingIndex = found
  }

  return sentences[closingIndex - 1] ?? null
}

function sentenceVariety(sentences) {
  let short = 0
  let long = 0

  for (const sentence of sentences) {
    const words = countWords(sentence)
    if (words <= SHORT_SENTENCE_WORDS) short += 1
    else if (words >= LONG_SENTENCE_WORDS) long += 1
  }

  const counted = short + long
  return counted ? Number((short / counted).toFixed(3)) : null
}

function extractStyle(scriptText, { candidateName = null } = {}) {
  const sentences = toSentences(scriptText)
  const hook = sentences[0] ?? ""

  return {
    ...parseBreaks(scriptText),
    hookFirstWords:
      hook.split(/\s+/).slice(0, HOOK_FIRST_WORDS).join(" ") || null,
    hookWordCount: hook ? countWords(hook) : null,
    outroLeadIn: findOutroLeadIn(sentences, candidateName),
    sentenceVarietyScore: sentenceVariety(sentences),
    hookText: hook,
  }
}

async function classifyHooks({ userId, settings, hooks }) {
  if (!hooks.length) return new Map()

  const resolved = new Map()

  for (let index = 0; index < hooks.length; index += TAG_BATCH_SIZE) {
    const batch = hooks.slice(index, index + TAG_BATCH_SIZE)

    let output
    try {
      output = await runStructured({
        userId,
        settings,
        prompt: buildStyleTaggerPrompt(batch),
        schemaName: "hook_types",
        schema: buildStyleTaggerSchema(),
        label: "Style tagging",
      })
    } catch (error) {
      logger.warn(`Hook classification failed for ${batch.length} script(s): ${error.message}`)
      continue
    }

    const ids = new Set(batch.map((hook) => hook.id))

    for (const entry of output.hooks ?? []) {
      if (!ids.has(entry.id)) continue
      if (!HOOK_TYPES.includes(entry.hook_type)) continue
      resolved.set(entry.id, entry.hook_type)
    }
  }

  return resolved
}

module.exports = {
  extractStyle,
  classifyHooks,
  parseBreaks,
  toSentences,
  sentenceVariety,
  findOutroLeadIn,
  TAG_BATCH_SIZE,
}
