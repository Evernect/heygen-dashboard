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
