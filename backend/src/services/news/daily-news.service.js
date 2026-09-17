"use strict"

const { prisma } = require("../../lib/prisma")
const { generateForTopic } = require("../script-generation.service")
const { badRequest, notFound } = require("../../utils/errors")
const { issueCode } = require("../../utils/timezone")
const { logger } = require("../../utils/logger")

/**
 * Joins each written angle back to the cluster it came from.
 *
 * Pure. An id that resolves to no cluster does not drop the pick and does not
 * fail the run: the row is kept, marked `unmatched`, and shown with a warning.
 * A hallucinated id usually means the model wrote a real topic against a story
 * it merged from two candidates — the topic is often still good, it just cannot
 * be traced back to its sources.
 */
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

/** Writes a run's picks. Re-running a day updates that day's rows in place. */
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

/**
 * Materialises the Topic this item stands for, then generates scripts from it
 * exactly as the content bank does.
 *
 * The Topic is tagged DAILY_NEWS so it never shows up in the content bank, and
 * it is reused on a second press rather than piling up duplicates. Going
 * through a real Topic is what lets every downstream stage — render, approve,
 * publish, metrics — stay completely unaware that daily news exists.
 */
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
        // The item may have been edited since it was last generated from.
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
