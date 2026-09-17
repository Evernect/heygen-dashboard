"use strict"

const { runDuePublishing } = require("../services/publish-orchestrator")
const { runDueNewsPipelines } = require("../services/news/news-pipeline.service")
const { logger } = require("../utils/logger")

let isRunning = false

let isNewsRunning = false

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
