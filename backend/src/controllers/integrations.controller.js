"use strict"

const credentials = require("../services/heygen-credentials.service")
const { env } = require("../lib/env")

/**
 * Meta is still configured from the environment, so its status is the same for
 * every tenant and is derived rather than stored.
 *
 * Only whether a value is present is reported — never the value itself. The
 * page id is not a secret but the access token is, and a status endpoint is
 * not worth the risk of getting that distinction wrong later.
 */
function metaStatus() {
  const hasToken = Boolean(env.META_PAGE_ACCESS_TOKEN)

  return {
    source: "environment",
    dryRun: env.DRY_RUN_META,
    accessTokenConfigured: hasToken,
    platforms: [
      {
        platform: "FACEBOOK",
        // A page id without a token cannot publish, so neither half alone
        // counts as configured.
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
