"use strict"

const { prisma } = require("../../lib/prisma")
const { METRIC_FETCHERS } = require("../meta-graph.service")
const { METRICS_WINDOW_DAYS } = require("./scoring.service")
const { logger } = require("../../utils/logger")

const MS_PER_DAY = 24 * 60 * 60 * 1000

const MAX_REPORTED_FAILURES = 3

function windowStart(now) {
  return new Date(now.getTime() - METRICS_WINDOW_DAYS * MS_PER_DAY)
}

async function findPostsToPoll(userId, now) {
  return prisma.platformPost.findMany({
    where: {
      status: "SUCCESS",
      platformPostId: { not: null },
      platform: { in: Object.keys(METRIC_FETCHERS) },
      publishedAt: { gte: windowStart(now) },
      script: { userId },
    },
    select: { id: true, platform: true, platformPostId: true },
  })
}

async function syncMetricsForUser(userId, now = new Date()) {
  const posts = await findPostsToPoll(userId, now)

  const counters = { postsPolled: 0, postsFailed: 0, metricsWritten: 0 }
  const failures = []

  for (const post of posts) {
    counters.postsPolled += 1

    try {
      const fetchMetrics = METRIC_FETCHERS[post.platform]
      const metrics = await fetchMetrics(post.platformPostId)

      await prisma.videoMetric.create({
        data: { platformPostId: post.id, ...metrics },
      })

      counters.metricsWritten += 1
    } catch (error) {
      counters.postsFailed += 1
      failures.push(`${post.platform} ${post.platformPostId}: ${error.message}`)
      logger.warn(
        `Metrics fetch failed for ${post.platform} post ${post.platformPostId}: ${error.message}`
      )
    }
  }

  const warnings = []
  if (counters.postsFailed) {
    const named = failures.slice(0, MAX_REPORTED_FAILURES).join("; ")
    const rest = failures.length - MAX_REPORTED_FAILURES
    warnings.push(
      `${counters.postsFailed} of ${posts.length} posts could not be read. ${named}${
        rest > 0 ? ` (and ${rest} more)` : ""
      }`
    )
  }

  return { counters, warnings }
}

module.exports = { syncMetricsForUser, findPostsToPoll }
