"use strict"

const { prisma } = require("../../lib/prisma")
const { generateForTopic } = require("../script-generation.service")
const { badRequest, notFound } = require("../../utils/errors")
const { issueCode } = require("../../utils/timezone")
const { logger } = require("../../utils/logger")

function buildItemsFromPicks({ angles, clusters, localDate, localTime }) {
  const byId = new Map(clusters.map((cluster) => [cluster.clusterId, cluster]))

  return angles.map((angle, index) => {
    const cluster = byId.get(angle.id)

    const conflicts = [
      angle.conflict_flag || "",
      cluster ? "" : `UNMATCHED: no story matched id ${angle.id} — verify the sources by hand`,
    ].filter(Boolean)

    return {
      issueCode: issueCode(localDate, index),
      topic: angle.topic,
      angle: angle.angle ?? "",
      whyNow: angle.why_now ?? "",
      importance: angle.importance ?? "Medium",
      importanceScore: cluster ? cluster.score : Number(angle.importance_score) || 0,
      sourceSummary: angle.source_summary ?? "",
      headlinesOnly: String(angle.source_summary ?? "")
        .trimStart()
        .startsWith("HEADLINES ONLY:"),
      conflictFlag: conflicts.join(" | ") || null,
      clusterId: cluster ? cluster.clusterId : null,
      unmatched: !cluster,
      headline: cluster?.clusterTitle ?? null,
      outlet: cluster?.outlet ?? null,
      sourceUrls: cluster?.urls ?? [],
      outletCount: cluster?.outletCount ?? 0,
      publishedAt: cluster?.publishedAt ? new Date(cluster.publishedAt) : null,
      localDate,
      localTime,
    }
  })
}

async function saveItems({ userId, runId, rows }) {
  if (!rows.length) return []

  return prisma.$transaction(
    rows.map((row) =>
      prisma.dailyNewsItem.upsert({
        where: { userId_issueCode: { userId, issueCode: row.issueCode } },
        create: { ...row, userId, runId },
        update: { ...row, runId, status: "NEW", generateError: null },
      })
    )
  )
}

async function listItems({ userId, status, page = 1, pageSize = 20 }) {
  const where = { userId, ...(status ? { status } : {}) }

  const [items, total] = await prisma.$transaction([
    prisma.dailyNewsItem.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { issueCode: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dailyNewsItem.count({ where }),
  ])

  return { items, total, page, pageSize }
}

async function generateFromItem({ itemId, userId }) {
  const item = await prisma.dailyNewsItem.findFirst({
    where: { id: itemId, userId },
  })
  if (!item) throw notFound("News item not found")

  if (!item.angle?.trim()) {
    throw badRequest(
      "This item has no angle yet. Add one before generating scripts from it."
    )
  }

  const topic = item.topicId
    ? await prisma.topic.update({
        where: { id: item.topicId },
        data: { issue: item.topic, angle: item.angle },
      })
    : await prisma.topic.create({
        data: {
          userId,
          issue: item.topic,
          angle: item.angle,
          source: "DAILY_NEWS",
        },
      })

  await prisma.dailyNewsItem.update({
    where: { id: item.id },
    data: {
      topicId: topic.id,
      status: "GENERATING",
      generateRequestedAt: new Date(),
      generateError: null,
    },
  })

  try {
    const scripts = await generateForTopic({ topicId: topic.id, userId })

    await prisma.dailyNewsItem.update({
      where: { id: item.id },
      data: { status: "GENERATED", generateError: null },
    })

    logger.info(`Generated ${scripts.length} script(s) for news item ${item.issueCode}`)
    return scripts
  } catch (error) {
    await prisma.dailyNewsItem.update({
      where: { id: item.id },
      data: { status: "ERROR", generateError: error.message?.slice(0, 500) },
    })
    throw error
  }
}

module.exports = {
  buildItemsFromPicks,
  saveItems,
  listItems,
  generateFromItem,
}
