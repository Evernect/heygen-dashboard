"use strict"

const { prisma } = require("../../lib/prisma")
const { scoreRows, engagementRate } = require("./scoring.service")
const { extractStyle, classifyHooks } = require("./style-tagger.service")
const { logger } = require("../../utils/logger")

async function loadPostedScripts(userId) {
  const posts = await prisma.platformPost.findMany({
    where: { status: "SUCCESS", script: { userId } },
    select: {
      platform: true,
      publishedAt: true,
      scriptId: true,
      metrics: { orderBy: { fetchedAt: "desc" }, take: 1 },
      script: { select: { id: true, scriptText: true } },
    },
  })

  const byScript = new Map()

  for (const post of posts) {
    const latest = post.metrics[0]

    const entry = byScript.get(post.scriptId) ?? {
      scriptId: post.scriptId,
      scriptText: post.script.scriptText,
      postedAt: post.publishedAt,
      platforms: [],
    }

    if (
      post.publishedAt &&
      (!entry.postedAt || post.publishedAt < entry.postedAt)
    ) {
      entry.postedAt = post.publishedAt
    }

    entry.platforms.push({
      platform: post.platform,
      views: latest?.views ?? 0,
      likes: latest?.likes ?? 0,
      comments: latest?.comments ?? 0,
      shares: latest?.shares ?? 0,
    })

    byScript.set(post.scriptId, entry)
  }

  return [...byScript.values()]
}

function totalsFor(platforms) {
  return platforms.reduce(
    (totals, entry) => ({
      totalViews: totals.totalViews + entry.views,
      totalEngagement:
        totals.totalEngagement + entry.likes + entry.comments + entry.shares,
    }),
    { totalViews: 0, totalEngagement: 0 }
  )
}

async function recomputePerformance(userId, now = new Date()) {
  const rows = await loadPostedScripts(userId)
  if (!rows.length) return { scriptsScored: 0, sampleSize: 0 }

  const { rows: scored, sampleSize } = scoreRows(rows, now)

  for (const row of scored) {
    const totals = totalsFor(row.platforms)

    const data = {
      userId,
      postedAt: row.postedAt,
      platformsPosted: row.platforms.map((entry) => entry.platform),
      compositeScore: row.compositeScore,
      performanceTier: row.performanceTier,
      lastComputedAt: now,
      ...totals,
    }

    await prisma.scriptPerformance.upsert({
      where: { scriptId: row.scriptId },
      create: { scriptId: row.scriptId, ...data },
      update: data,
    })
  }

  return { scriptsScored: scored.length, sampleSize }
}

async function tagUntaggedScripts({ userId, settings, candidateName }) {
  const pending = await prisma.scriptPerformance.findMany({
    where: {
      userId,
      styleTaggedAt: null,
      performanceTier: { not: "TOO_NEW" },
    },
    select: { scriptId: true, script: { select: { scriptText: true } } },
  })

  if (!pending.length) return { scriptsTagged: 0, warnings: [] }

  const extracted = pending.map((row) => ({
    scriptId: row.scriptId,
    ...extractStyle(row.script.scriptText, { candidateName }),
  }))

  const hookTypes = await classifyHooks({
    userId,
    settings,
    hooks: extracted
      .filter((row) => row.hookText)
      .map((row) => ({ id: row.scriptId, text: row.hookText })),
  })

  const now = new Date()
  let scriptsTagged = 0

  for (const row of extracted) {
    await prisma.scriptPerformance.update({
      where: { scriptId: row.scriptId },
      data: {
        hookType: hookTypes.get(row.scriptId) ?? null,
        hookFirstWords: row.hookFirstWords,
        hookWordCount: row.hookWordCount,
        outroLeadIn: row.outroLeadIn,
        breakCount: row.breakCount,
        avgBreakDuration: row.avgBreakDuration,
        sentenceVarietyScore: row.sentenceVarietyScore,
        styleTaggedAt: now,
      },
    })
    scriptsTagged += 1
  }

  const unclassified = extracted.length - hookTypes.size
  const warnings = unclassified
    ? [`${unclassified} script(s) were measured but their hook type could not be classified.`]
    : []

  logger.info(
    `Tagged ${scriptsTagged} script(s) for ${userId} (${hookTypes.size} hook types resolved)`
  )

  return { scriptsTagged, warnings }
}

async function loadAnalystRows(userId) {
  const performances = await prisma.scriptPerformance.findMany({
    where: { userId, performanceTier: { not: "TOO_NEW" } },
    orderBy: { compositeScore: "desc" },
    select: {
      scriptId: true,
      postedAt: true,
      hookType: true,
      hookFirstWords: true,
      hookWordCount: true,
      outroLeadIn: true,
      breakCount: true,
      avgBreakDuration: true,
      sentenceVarietyScore: true,
      compositeScore: true,
      performanceTier: true,
      platformsPosted: true,
      script: { select: { title: true } },
    },
  })

  if (!performances.length) return []

  const posts = await prisma.platformPost.findMany({
    where: {
      status: "SUCCESS",
      scriptId: { in: performances.map((row) => row.scriptId) },
    },
    select: {
      scriptId: true,
      platform: true,
      metrics: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  })

  const byScript = new Map()
  for (const post of posts) {
    const latest = post.metrics[0]
    const stats = byScript.get(post.scriptId) ?? {}

    const reading = {
      views: latest?.views ?? 0,
      likes: latest?.likes ?? 0,
      comments: latest?.comments ?? 0,
      shares: latest?.shares ?? 0,
    }

    stats[post.platform.toLowerCase()] = {
      views: reading.views,
      engagement_rate: Number(engagementRate(reading).toFixed(4)),
    }

    byScript.set(post.scriptId, stats)
  }

  return performances.map((row) => ({
    title: row.script.title,
    posted_at: row.postedAt?.toISOString().slice(0, 10) ?? null,
    hook_type: row.hookType,
    hook_first_words: row.hookFirstWords,
    hook_word_count: row.hookWordCount,
    outro_lead_in: row.outroLeadIn,
    break_count: row.breakCount,
    avg_break_duration: row.avgBreakDuration,
    sentence_variety_score: row.sentenceVarietyScore,
    platforms_posted: row.platformsPosted.map((p) => p.toLowerCase()).join(", "),
    per_platform: byScript.get(row.scriptId) ?? {},
    composite_score: row.compositeScore,
    performance_tier: row.performanceTier.toLowerCase(),
  }))
}

module.exports = {
  loadPostedScripts,
  recomputePerformance,
  tagUntaggedScripts,
  loadAnalystRows,
}
