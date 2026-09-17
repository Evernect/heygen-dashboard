"use strict"

const { prisma } = require("../lib/prisma")
const { decryptSecret, encryptSecret, maskSecret } = require("../lib/crypto")
const { env } = require("../lib/env")
const { HttpError } = require("../utils/errors")

function toPublic(connection) {
  if (!connection) return null

  return {
    connected: true,
    apiKeyHint: connection.apiKeyHint,
    accountEmail: connection.accountEmail,
    accountUsername: connection.accountUsername,
    connectedAt: connection.connectedAt,
    lastVerifiedAt: connection.lastVerifiedAt,
    updatedAt: connection.updatedAt,
  }
}

function getConnection(userId) {
  return prisma.heygenConnection.findUnique({ where: { userId } })
}

async function saveConnection({ userId, apiKey, account }) {
  const data = {
    apiKeyCipher: encryptSecret(apiKey),
    apiKeyHint: maskSecret(apiKey),
    accountEmail: account?.email ?? null,
    accountUsername: account?.username ?? null,
    lastVerifiedAt: new Date(),
  }

  return prisma.heygenConnection.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}

function deleteConnection(userId) {
  return prisma.heygenConnection.deleteMany({ where: { userId } })
}

async function resolveApiKey(userId) {
  if (userId) {
    const connection = await getConnection(userId)
    if (connection) return decryptSecret(connection.apiKeyCipher)
  }

  if (env.HEYGEN_API_KEY) return env.HEYGEN_API_KEY

  throw new HttpError(
    400,
    "No HeyGen account is connected. Add your API key on the Settings page."
  )
}

module.exports = {
  getConnection,
  saveConnection,
  deleteConnection,
  resolveApiKey,
  toPublic,
}
