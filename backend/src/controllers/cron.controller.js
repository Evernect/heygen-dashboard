"use strict"

const { runDuePublishing } = require("../services/publish-orchestrator")
const { logger } = require("../utils/logger")

// Prevents a slow tick from overlapping with the next minute's trigger.
let isRunning = false

/**
 * Scheduling webhook, called every minute by Supabase pg_cron via pg_net.
 * Advances any in-flight HeyGen render (the dashboard polls its own, so this is
 * the safety net for a closed tab) and publishes whatever is due.
 */
async function publishDue(req, res) {
  if (isRunning) {
    logger.info("Publishing tick skipped — previous run still in progress")
    return res.status(202).json({ status: "skipped", reason: "already running" })
  }

  isRunning = true
  res.status(202).json({ status: "accepted" })

  try {
    const result = await runDuePublishing()
    if (result.claimed > 0) {
      logger.info(`Publishing tick finished (${result.claimed} claimed)`)
    }
  } catch (error) {
    logger.error("Publishing tick failed", error)
  } finally {
    isRunning = false
  }
}

module.exports = { publishDue }
