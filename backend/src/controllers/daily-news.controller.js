"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const dailyNews = require("../services/news/daily-news.service")
const { runNewsPipelineForUser } = require("../services/news/news-pipeline.service")
const { conflict, notFound } = require("../utils/errors")
const { logger } = require("../utils/logger")

const DAILY_NEWS_STATUSES = [
  "NEW",
  "GENERATING",
  "GENERATED",
  "ERROR",
  "DISMISSED",
]

const DEFAULT_PAGE_SIZE = 20

const listQuerySchema = z.object({
  status: z.enum(DAILY_NEWS_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(DEFAULT_PAGE_SIZE),
})

const updateItemSchema = z
  .object({
    topic: z.string().trim().min(3).max(300),
    angle: z.string().trim().min(3).max(2000),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  })

const runSchema = z.object({ force: z.boolean().optional().default(false) })

/**
 * Tenants with a run in flight in this process.
 *
 * A convenience that stops someone double-clicking Run now; the real guard
 * against a duplicate run is the unique (userId, localDate) key the pipeline
 * takes before it does any work.
 */
const running = new Set()

function owned(req) {
  return { id: req.params.id, userId: req.user.id }
}

async function listDailyNews(req, res) {
  const { status, page, pageSize } = req.validatedQuery ?? {}

  res.json(
    await dailyNews.listItems({ userId: req.user.id, status, page, pageSize })
  )
}

async function updateDailyNewsItem(req, res) {
  const existing = await prisma.dailyNewsItem.findFirst({ where: owned(req) })
  if (!existing) throw notFound("News item not found")

  res.json(
    await prisma.dailyNewsItem.update({
      where: { id: existing.id },
      data: req.body,
    })
  )
}

async function generateFromDailyNewsItem(req, res) {
  const scripts = await dailyNews.generateFromItem({
    itemId: req.params.id,
    userId: req.user.id,
  })

  res.status(201).json({ scripts, count: scripts.length })
}

async function dismissDailyNewsItem(req, res) {
  const existing = await prisma.dailyNewsItem.findFirst({ where: owned(req) })
  if (!existing) throw notFound("News item not found")

  if (existing.status === "GENERATED") {
    throw conflict(
      "This item already has scripts. Disapprove them from Approvals instead."
    )
  }

  res.json(
    await prisma.dailyNewsItem.update({
      where: { id: existing.id },
      data: { status: "DISMISSED" },
    })
  )
}

async function deleteDailyNewsItem(req, res) {
  const existing = await prisma.dailyNewsItem.findFirst({ where: owned(req) })
  if (!existing) throw notFound("News item not found")

  if (existing.topicId) {
    const scripts = await prisma.script.count({
      where: { topicId: existing.topicId },
    })

    if (scripts > 0) {
      throw conflict(
        `This item has ${scripts} generated script(s) and cannot be deleted.`
      )
    }

    // Nothing hangs off the materialised topic, so it goes too rather than
    // being left behind invisible to every screen.
    await prisma.topic.deleteMany({
      where: { id: existing.topicId, userId: req.user.id },
    })
  }

  await prisma.dailyNewsItem.delete({ where: { id: existing.id } })
  res.status(204).send()
}

/**
 * Runs the pipeline now rather than waiting for the morning.
 *
 * Answers immediately and works in the background: a full run takes minutes,
 * most of it deliberate spacing between feed requests. The dashboard follows it
 * through the run record.
 */
async function runNow(req, res) {
  const userId = req.user.id

  if (running.has(userId)) {
    throw conflict("A news run is already in progress.")
  }

  running.add(userId)
  res.status(202).json({ status: "accepted" })

  try {
    const result = await runNewsPipelineForUser({
      userId,
      trigger: "MANUAL",
      force: req.body.force,
    })

    logger.info(`Manual news run for ${userId} finished: ${result.status}`)
  } catch (error) {
    logger.error(`Manual news run for ${userId} failed`, error)
  } finally {
    running.delete(userId)
  }
}

async function listRuns(req, res) {
  const runs = await prisma.newsRun.findMany({
    where: { userId: req.user.id },
    orderBy: { startedAt: "desc" },
    take: 14,
  })

  res.json({ runs })
}

async function latestRun(req, res) {
  const run = await prisma.newsRun.findFirst({
    where: { userId: req.user.id },
    orderBy: { startedAt: "desc" },
  })

  // Whether the tenant is configured at all is what the empty state needs to
  // know, and it is cheaper to answer here than in a second request.
  const profile = await prisma.campaignProfile.findUnique({
    where: { userId: req.user.id },
    select: { candidateName: true, newsEnabled: true, newsRunHour: true, timezone: true },
  })

  res.json({ run, profile, inProgress: running.has(req.user.id) })
}

module.exports = {
  listDailyNews,
  updateDailyNewsItem,
  generateFromDailyNewsItem,
  dismissDailyNewsItem,
  deleteDailyNewsItem,
  runNow,
  listRuns,
  latestRun,
  schemas: { listQuerySchema, updateItemSchema, runSchema },
}
