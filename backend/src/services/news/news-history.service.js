"use strict"

const { prisma } = require("../../lib/prisma")
const { logger } = require("../../utils/logger")
const { HISTORY_DAYS, RETENTION_DAYS } = require("./scoring-constants")

const DAY_MS = 24 * 3600 * 1000

async function loadRecentHistory(userId, days = HISTORY_DAYS) {
  const since = new Date(Date.now() - days * DAY_MS)

  const rows = await prisma.newsClusterHistory.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { tokens: true },
  })

  return rows
}

async function appendHistory({ userId, runId, clusters }) {
  if (!clusters?.length) return 0

  const { count } = await prisma.newsClusterHistory.createMany({
    data: clusters.map((cluster) => ({
      userId,
      runId,
      clusterId: cluster.clusterId,
      headline: cluster.clusterTitle,
      topicLabels: cluster.topicLabels || null,
      tokens: cluster.tokens,
      articleCount: cluster.articleCount,
      outletCount: cluster.outletCount,
      score: cluster.score,
      isDistrict: cluster.isDistrict,
      isNamed: cluster.isNamed,
      topUrl: cluster.urls?.[0] ?? null,
    })),
  })

  return count
}

async function clearRunHistory(runId) {
  if (!runId) return 0
  const { count } = await prisma.newsClusterHistory.deleteMany({ where: { runId } })
  return count
}

async function pruneHistory(userId, days = RETENTION_DAYS) {
  const before = new Date(Date.now() - days * DAY_MS)

  const { count } = await prisma.newsClusterHistory.deleteMany({
    where: { userId, createdAt: { lt: before } },
  })

  if (count > 0) {
    logger.info(`Pruned ${count} news history row(s) older than ${days} days`)
  }

  return count
}

module.exports = {
  loadRecentHistory,
  appendHistory,
  clearRunHistory,
  pruneHistory,
}
