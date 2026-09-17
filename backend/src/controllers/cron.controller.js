"use strict"

const { runDuePublishing } = require("../services/publish-orchestrator")
const { runDueNewsPipelines } = require("../services/news/news-pipeline.service")
const { logger } = require("../utils/logger")

// Prevents a slow tick from overlapping with the next minute's trigger.
let isRunning = false

// The same idea for the news sweep, which takes minutes rather than seconds.
// This is only a per-process convenience: it does nothing across a restart or a
// second instance. The invariant that stops a tenant being run twice in a day
// is the unique (userId, localDate) key the pipeline claims before it works.
let isNewsRunning = false

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

/**
 * The daily news sweep, called by pg_cron on both sides of the DST boundary.
 *
 * Which tenants actually run is decided in the pipeline, against each one's own
 * timezone, so a fixed UTC schedule does not have to be right — it only has to
 * fire at both candidate hours. Whichever call is not the tenant's morning
 * finds nobody due, and a second call in the same local day collides with that
 * day's run record and is recorded as skipped.
 */
async function newsDue(req, res) {
  if (isNewsRunning) {
    logger.info("News tick skipped — previous run still in progress")
    return res.status(202).json({ status: "skipped", reason: "already running" })
  }

  isNewsRunning = true
  res.status(202).json({ status: "accepted" })

  try {
    const result = await runDueNewsPipelines()
    if (result.considered > 0) {
      logger.info(`News tick finished (${result.ran} tenant(s) run)`)
    }
  } catch (error) {
    logger.error("News tick failed", error)
  } finally {
    isNewsRunning = false
  }
}

module.exports = { publishDue, newsDue }
