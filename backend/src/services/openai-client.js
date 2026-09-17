"use strict"

const OpenAI = require("openai")

const { getSettings } = require("./settings.service")
const { requireEnv } = require("../lib/env")
const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")

let client = null

function getClient() {
  if (!client) {
    const [apiKey] = requireEnv("OPENAI_API_KEY")
    client = new OpenAI({ apiKey })
  }
  return client
}

const UNSUPPORTED_PARAM = /Unsupported (parameter|value): '?(\w+)/i

/**
 * The name of the parameter a model refused, or null when the failure was
 * something else. Models differ in which of `temperature` and
 * `reasoning.effort` they accept, and they say so only at request time.
 */
function rejectedParameter(error) {
  const message = error?.message ?? ""
  if (error?.status !== 400) return null

  const match = message.match(UNSUPPORTED_PARAM)
  if (match) return match[2]

  if (/temperature/i.test(message)) return "temperature"
  if (/reasoning/i.test(message)) return "reasoning"
  return null
}

/** Retries once without whichever optional parameter the model turned down. */
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

/**
 * One structured-output call on the caller's configured model, returning the
 * parsed JSON.
 *
 * Every LLM call in the app wants the same five things around it: the user's
 * model and optional tuning parameters, the fallback retry for models that
 * refuse one of them, a strict JSON schema, and an upstream failure turned into
 * a 502 rather than an unhandled rejection. `label` is what the caller is
 * called in the error the user ends up reading.
 *
 * `settings` may be passed in when the caller already read them, which saves a
 * cache lookup; otherwise they are resolved here.
 */
async function runStructured({
  userId,
  prompt,
  schemaName,
  schema,
  label = "Request",
  settings,
}) {
  const openai = getClient()
  const resolved = settings ?? (await getSettings(userId))

  const request = {
    model: resolved.openaiModel,
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  }

  if (resolved.openaiSendTemperature) {
    request.temperature = resolved.openaiTemperature
  }

  if (resolved.openaiReasoningEffort) {
    request.reasoning = { effort: resolved.openaiReasoningEffort }
  }

  let response
  try {
    response = await createWithFallback(openai, request)
  } catch (error) {
    logger.error(`OpenAI request failed (${label})`, error)
    throw new HttpError(
      502,
      `${label} failed: ${error.message ?? "unknown OpenAI error"}`
    )
  }

  const content = response.output_text
  if (!content) {
    throw new HttpError(502, `${label} returned an empty response`)
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new HttpError(502, `${label} returned malformed JSON`)
  }
}

module.exports = {
  getClient,
  rejectedParameter,
  createWithFallback,
  runStructured,
}
