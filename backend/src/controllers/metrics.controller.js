"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const {
  runMetricsSweepForUser,
  runAnalysisForUser,
} = require("../services/insights/insights-pipeline.service")
const { conflict } = require("../utils/errors")
const { logger } = require("../utils/logger")

const DEFAULT_PERFORMANCE_PAGE_SIZE = 20

const performanceQuerySchema = z.object({
  tier: z.enum(["TOP", "MID", "BOTTOM", "TOO_NEW"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(DEFAULT_PERFORMANCE_PAGE_SIZE),
})

const runSchema = z.object({
  kind: z.enum(["METRICS", "ANALYSIS"]).optional().default("METRICS"),
  force: z.boolean().optional().default(false),
})

const RUNNERS = {
  METRICS: runMetricsSweepForUser,
  ANALYSIS: runAnalysisForUser,
}

const running = new Set()

function runKey(userId, kind) {
  return `${userId}|${kind}`
}

async function loadLatestMetrics(userId) {
  const posts = await prisma.platformPost.findMany({
    where: { status: "SUCCESS", script: { userId } },
    include: {
      metrics: { orderBy: { fetchedAt: "desc" }, take: 1 },
      script: {
        select: {
          id: true,
          title: true,
          topic: { select: { id: true, issue: true } },
        },
      },
    },
  })

  return posts.map((post) => {
    const latest = post.metrics[0]
    const views = latest?.views ?? 0
    const likes = latest?.likes ?? 0
    const comments = latest?.comments ?? 0
    const shares = latest?.shares ?? 0

    return {
      post,
      views,
      likes,
      comments,
      shares,
      engagement: likes + comments + shares,
      fetchedAt: latest?.fetchedAt ?? null,
    }
  })
}

async function getSummary(req, res) {
  const rows = await loadLatestMetrics(req.user.id)

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0)
  const totalEngagement = rows.reduce((sum, row) => sum + row.engagement, 0)

  const byTopic = new Map()
  for (const row of rows) {
    const topic = row.post.script?.topic
    if (!topic) continue

    const entry = byTopic.get(topic.id) ?? {
      topicId: topic.id,
      issue: topic.issue,
      views: 0,
      engagement: 0,
    }
    entry.views += row.views
    entry.engagement += row.engagement
    byTopic.set(topic.id, entry)
  }
  const topTopics = [...byTopic.values()]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 8)

  const byPlatform = new Map()
  for (const row of rows) {
    const entry = byPlatform.get(row.post.platform) ?? {
      platform: row.post.platform,
      views: 0,
      engagement: 0,
      posts: 0,
    }
    entry.views += row.views
    entry.engagement += row.engagement
    entry.posts += 1
    byPlatform.set(row.post.platform, entry)
  }

  const byDate = new Map()
  for (const row of rows) {
    const publishedAt = row.post.publishedAt
    if (!publishedAt) continue

    const date = publishedAt.toISOString().slice(0, 10)
    const entry = byDate.get(date) ?? {
      date,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    }
    entry.views += row.views
    entry.likes += row.likes
    entry.comments += row.comments
    entry.shares += row.shares
    byDate.set(date, entry)
  }

  res.json({
    summary: {
      totalViews,
      totalEngagement,
      averageEngagement: rows.length
        ? Math.round(totalEngagement / rows.length)
        : 0,
      totalPosts: rows.length,
      topTopic: topTopics[0]?.issue ?? null,
    },
    engagementOverTime: [...byDate.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    topTopics,
    platformPerformance: [...byPlatform.values()],
  })
}

async function listInsights(req, res) {
  const insights = await prisma.insight.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  res.json(insights)
}

async function listScriptPerformance(req, res) {
  const { tier, page, pageSize } = req.validatedQuery ?? {}

  const where = {
    userId: req.user.id,
    ...(tier ? { performanceTier: tier } : {}),
  }

  const [rows, total] = await prisma.$transaction([
    prisma.scriptPerformance.findMany({
      where,
      orderBy: [{ compositeScore: "desc" }, { postedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        script: {
          select: {
            id: true,
            title: true,
            variantLabel: true,
            topic: { select: { id: true, issue: true } },
          },
        },
      },
    }),
    prisma.scriptPerformance.count({ where }),
  ])

  res.json({ rows, total, page, pageSize })
}

async function listRuns(req, res) {
  const runs = await prisma.insightsRun.findMany({
    where: { userId: req.user.id },
    orderBy: { startedAt: "desc" },
    take: 20,
  })

  res.json({ runs })
}

async function latestRun(req, res) {
  const userId = req.user.id

  const [metrics, analysis, profile, playbook] = await Promise.all([
    prisma.insightsRun.findFirst({
      where: { userId, kind: "METRICS" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.insightsRun.findFirst({
      where: { userId, kind: "ANALYSIS" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.campaignProfile.findUnique({
      where: { userId },
      select: {
        candidateName: true,
        timezone: true,
        insightsEnabled: true,
        metricsRunHour: true,
        analysisWeekday: true,
        analysisRunHour: true,
      },
    }),
    prisma.stylePlaybook.findFirst({
      where: { userId, isActive: true, source: "GENERATED" },
      orderBy: { createdAt: "desc" },
    }),
  ])

  res.json({
    metrics,
    analysis,
    profile,
    activeGuidance: playbook,
    inProgress: {
      metrics: running.has(runKey(userId, "METRICS")),
      analysis: running.has(runKey(userId, "ANALYSIS")),
    },
  })
}

async function runNow(req, res) {
  const userId = req.user.id
  const { kind, force } = req.body

  const key = runKey(userId, kind)
  if (running.has(key)) {
    throw conflict("That run is already in progress.")
  }

  running.add(key)
  res.status(202).json({ status: "accepted", kind })

  try {
    const result = await RUNNERS[kind]({ userId, trigger: "MANUAL", force })
    logger.info(`Manual ${kind} run for ${userId} finished: ${result.status}`)
  } catch (error) {
    logger.error(`Manual ${kind} run for ${userId} failed`, error)
  } finally {
    running.delete(key)
  }
}

module.exports = {
  getSummary,
  listInsights,
  listScriptPerformance,
  listRuns,
  latestRun,
  runNow,
  schemas: { performanceQuerySchema, runSchema },
}
