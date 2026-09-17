"use strict"

const { prisma } = require("../lib/prisma")
const { decryptSecret, encryptSecret, maskSecret } = require("../lib/crypto")
const { env } = require("../lib/env")
const { HttpError } = require("../utils/errors")

/** The row as the dashboard is allowed to see it — never the key itself. */
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

  // Upsert, so "connect" and "update the key" are the same request.
  return prisma.heygenConnection.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}

function deleteConnection(userId) {
  return prisma.heygenConnection.deleteMany({ where: { userId } })
}

/**
 * The key a HeyGen call should run with.
 *
 * Always the owner's own connection — a request knows the caller, and
 * background work reads `Script.userId`, so even the `pg_cron` tick renders on
 * the right account. `HEYGEN_API_KEY` is only reached for a user who has not
 * connected one, which the onboarding gate makes hard to arrive at.
 */
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
