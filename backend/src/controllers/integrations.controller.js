"use strict"

const credentials = require("../services/heygen-credentials.service")
const { env } = require("../lib/env")

function metaStatus() {
  const hasToken = Boolean(env.META_PAGE_ACCESS_TOKEN)

  return {
    source: "environment",
    accessTokenConfigured: hasToken,
    platforms: [
      {
        platform: "FACEBOOK",
        configured: hasToken && Boolean(env.FACEBOOK_PAGE_ID),
        targetConfigured: Boolean(env.FACEBOOK_PAGE_ID),
      },
      {
        platform: "INSTAGRAM",
        configured: hasToken && Boolean(env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
        targetConfigured: Boolean(env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
      },
    ],
  }
}

async function readIntegrations(req, res) {
  const connection = await credentials.getConnection(req.user.id)

  res.json({
    heygen: { connection: credentials.toPublic(connection) },
    meta: metaStatus(),
  })
}

module.exports = { readIntegrations }
