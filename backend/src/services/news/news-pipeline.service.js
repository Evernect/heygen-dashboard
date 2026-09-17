"use strict"

const { prisma } = require("../../lib/prisma")
const { getSettings } = require("../settings.service")
const { buildFeedRequests } = require("./feed-url.builder")
const { fetchFeeds } = require("./rss-fetch.service")
const { parseFeed } = require("./rss-parse")
const { flattenFeedItems } = require("./article-filter")
const { clusterAndScore } = require("./cluster-scoring")
const { fetchArticleTexts } = require("./article-text.service")
const { buildNewsContext } = require("./news-context.service")
const { selectTopics } = require("./news-selection.service")
const { writeAngles } = require("./news-angles.service")
const { buildItemsFromPicks, saveItems } = require("./daily-news.service")
const history = require("./news-history.service")
const { localDateParts } = require("../../utils/timezone")
const { logger } = require("../../utils/logger")
const { env } = require("../../lib/env")

const UNIQUE_VIOLATION = "P2002"

function emptyCounters() {
  return {
    keywordsUsed: 0,
    feedsFetched: 0,
    feedsFailed: 0,
    articlesFound: 0,
    articlesKept: 0,
    clustersScored: 0,
    articleTextsFetched: 0,
    itemsCreated: 0,
  }
}

async function claimRun({ userId, localDate, trigger, force }) {
  try {
    const run = await prisma.newsRun.create({
      data: { userId, localDate, trigger, status: "RUNNING" },
    })
    return { run, claimed: true }
  } catch (error) {
    if (error?.code !== UNIQUE_VIOLATION) throw error

    const existing = await prisma.newsRun.findUnique({
      where: { userId_localDate: { userId, localDate } },
    })

    if (!force) return { run: existing, claimed: false }

    await history.clearRunHistory(existing.id)

    const run = await prisma.newsRun.update({
      where: { id: existing.id },
      data: {
        status: "RUNNING",
        trigger,
        attempt: { increment: 1 },
        startedAt: new Date(),
        finishedAt: null,
        error: null,
        warnings: [],
        ...emptyCounters(),
      },
    })

    return { run, claimed: true }
  }
}

async function finishRun(runId, { status, counters, warnings, error }) {
  return prisma.newsRun.update({
    where: { id: runId },
    data: {
      status,
      finishedAt: new Date(),
      warnings: warnings ?? [],
      error: error ?? null,
      ...(counters ?? {}),
    },
  })
}

async function runNewsPipelineForUser({ userId, trigger = "CRON", force = false }) {
  const profile = await prisma.campaignProfile.findUnique({ where: { userId } })

  const { localDate, localTime } = localDateParts(
    new Date(),
    profile?.timezone ?? "UTC"
  )

  if (!profile) {
    logger.warn(`Skipping news run for ${userId}: no campaign profile`)
    return { status: "SKIPPED", reason: "No campaign profile configured" }
  }

  const { run, claimed } = await claimRun({ userId, localDate, trigger, force })

  if (!claimed) {
    logger.info(`News run for ${userId} on ${localDate} already exists; skipping`)
    return { status: "SKIPPED", reason: "Already run today", run }
  }

  const counters = emptyCounters()
  const warnings = []

  try {
    const keywords = await prisma.newsKeyword.findMany({
      where: { userId, active: true },
      orderBy: { keywordId: "asc" },
    })

    const requests = buildFeedRequests(keywords)
    counters.keywordsUsed = requests.length

    if (!requests.length) {
      await finishRun(run.id, {
        status: "SUCCEEDED",
        counters,
        warnings: ["No active keywords are configured, so there was nothing to fetch."],
      })
      return { status: "SUCCEEDED", run, items: [] }
    }

    const responses = await fetchFeeds(requests)
    const articles = []

    for (const response of responses) {
      if (response.error || !response.xml) {
        counters.feedsFailed += 1
        continue
      }

      const feed = parseFeed(response.xml)
      if (!feed) {
        counters.feedsFailed += 1
        continue
      }

      counters.feedsFetched += 1

      const flattened = flattenFeedItems({
        feed,
        keyword: response.keyword,
        now: Date.now(),
      })

      counters.articlesFound += flattened.found
      articles.push(...flattened.articles)
    }

    counters.articlesKept = articles.length

    if (counters.feedsFailed && counters.feedsFetched) {
      warnings.push(
        `${counters.feedsFailed} of ${requests.length} feeds could not be read.`
      )
    }

    if (!articles.length) {
      await finishRun(run.id, {
        status: counters.feedsFetched ? "SUCCEEDED" : "FAILED",
        counters,
        warnings,
        error: counters.feedsFetched
          ? null
          : "Every feed failed, so there was nothing to read.",
      })
      return { status: "SUCCEEDED", run, items: [] }
    }

    const recent = await history.loadRecentHistory(userId)

    const { clusters, stats } = clusterAndScore({
      articles,
      history: recent,
      signals: {
        districtTerms: profile.districtTerms ?? [],
        candidateName: profile.candidateName,
      },
      now: Date.now(),
    })

    counters.clustersScored = clusters.length

    logger.info(
      `News run ${run.id}: ${stats.articles} articles, ${stats.clustered} clusters, ` +
        `${stats.repeats} repeats, ${stats.shortlisted} shortlisted`
    )

    await history.appendHistory({ userId, runId: run.id, clusters })

    if (!clusters.length) {
      await finishRun(run.id, { status: "SUCCEEDED", counters, warnings })
      return { status: "SUCCEEDED", run, items: [] }
    }

    const articleTexts = await fetchArticleTexts(clusters)
    counters.articleTextsFetched = articleTexts.filter(Boolean).length

    if (!env.JINA_API_KEY) {
      warnings.push(
        "No Jina key is configured, so every summary was drawn from headlines alone."
      )
    } else if (!counters.articleTextsFetched) {
      warnings.push(
        "No article text could be read, so every summary was drawn from headlines alone."
      )
    }

    const settings = await getSettings(userId)
    const context = await buildNewsContext({ userId, clusters, articleTexts })

    const picks = await selectTopics({
      userId,
      profile,
      context,
      maxPicks: profile.topicsPerRun ?? 3,
      settings,
    })

    if (!picks.length) {
      warnings.push("Nothing in today's news cleared the editorial filters.")
      await finishRun(run.id, { status: "SUCCEEDED", counters, warnings })
      return { status: "SUCCEEDED", run, items: [] }
    }

    const { angles, warning } = await writeAngles({
      userId,
      picks,
      context,
      settings,
    })
    if (warning) warnings.push(warning)

    const rows = buildItemsFromPicks({ angles, clusters, localDate, localTime })
    const items = await saveItems({ userId, runId: run.id, rows })

    counters.itemsCreated = items.length

    const unmatched = rows.filter((row) => row.unmatched).length
    if (unmatched) {
      warnings.push(
        `${unmatched} topic(s) could not be traced back to a source story.`
      )
    }

    await history.pruneHistory(userId)

    await finishRun(run.id, {
      status: warnings.length ? "PARTIAL" : "SUCCEEDED",
      counters,
      warnings,
    })

    logger.info(`News run ${run.id} produced ${items.length} item(s)`)
    return { status: "SUCCEEDED", run, items }
  } catch (error) {
    logger.error(`News run ${run.id} failed`, error)

    await finishRun(run.id, {
      status: "FAILED",
      counters,
      warnings,
      error: error.message?.slice(0, 1000),
    })

    return { status: "FAILED", run, error }
  }
}

async function findTenantsDueNow(now = new Date()) {
  const profiles = await prisma.campaignProfile.findMany({
    where: { newsEnabled: true },
  })

  const reached = profiles
    .map((profile) => ({
      profile,
      ...localDateParts(now, profile.timezone),
    }))
    .filter((entry) => entry.hour >= entry.profile.newsRunHour)

  if (!reached.length) return []

  const runs = await prisma.newsRun.findMany({
    where: {
      userId: { in: reached.map((entry) => entry.profile.userId) },
      localDate: { in: [...new Set(reached.map((entry) => entry.localDate))] },
    },
    select: { userId: true, localDate: true },
  })

  const alreadyRun = new Set(runs.map((run) => `${run.userId}|${run.localDate}`))

  return reached
    .filter(
      (entry) => !alreadyRun.has(`${entry.profile.userId}|${entry.localDate}`)
    )
    .map((entry) => entry.profile)
}

async function runDueNewsPipelines(now = new Date()) {
  const due = await findTenantsDueNow(now)

  if (!due.length) return { considered: 0, ran: 0, results: [] }

  logger.info(`News sweep: ${due.length} tenant(s) due`)

  const results = []

  for (const profile of due) {
    try {
      const result = await runNewsPipelineForUser({
        userId: profile.userId,
        trigger: "CRON",
      })
      results.push({ userId: profile.userId, status: result.status })
    } catch (error) {
      logger.error(`News run threw for ${profile.userId}`, error)
      results.push({ userId: profile.userId, status: "FAILED" })
    }
  }

  return { considered: due.length, ran: results.length, results }
}

module.exports = {
  runNewsPipelineForUser,
  runDueNewsPipelines,
  findTenantsDueNow,
}
