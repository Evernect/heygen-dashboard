"use strict"

const { z } = require("zod")

const credentials = require("../services/heygen-credentials.service")
const heygen = require("../services/heygen.service")
const { logger } = require("../utils/logger")

const connectSchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(10, "That does not look like a HeyGen API key.")
    .max(500),
})

async function readConnection(req, res) {
  const connection = await credentials.getConnection(req.user.id)

  res.json({ connection: credentials.toPublic(connection) })
}

async function saveConnection(req, res) {
  const { apiKey } = req.body

  const account = await heygen.fetchAccount(apiKey)

  const connection = await credentials.saveConnection({
    userId: req.user.id,
    apiKey,
    account,
  })

  logger.info(`HeyGen account connected for user ${req.user.id}`)

  res.json({ connection: credentials.toPublic(connection) })
}

async function removeConnection(req, res) {
  await credentials.deleteConnection(req.user.id)

  logger.info(`HeyGen account disconnected for user ${req.user.id}`)

  res.json({ connection: null })
}

module.exports = {
  readConnection,
  saveConnection,
  removeConnection,
  schemas: { connectSchema },
}
