"use strict"

const crypto = require("node:crypto")

const { env } = require("../lib/env")
const { unauthorized, serviceUnavailable } = require("../utils/errors")
const { logger } = require("../utils/logger")

function safeEqual(a, b) {
  const bufferA = Buffer.from(String(a))
  const bufferB = Buffer.from(String(b))

  if (bufferA.length !== bufferB.length) {
    crypto.timingSafeEqual(bufferA, bufferA)
    return false
  }

  return crypto.timingSafeEqual(bufferA, bufferB)
}

// Guards the scheduling webhook
function cronAuth(req, res, next) {
  if (!env.CRON_SECRET) {
    return next(
      serviceUnavailable(
        "CRON_SECRET is not configured; refusing to run scheduled publishing."
      )
    )
  }

  const provided = req.get("x-cron-secret")

  if (!provided || !safeEqual(provided, env.CRON_SECRET)) {
    logger.warn(`Rejected cron request from ${req.ip} — bad or missing secret`)
    return next(unauthorized("Invalid cron secret"))
  }

  next()
}

module.exports = { cronAuth }
