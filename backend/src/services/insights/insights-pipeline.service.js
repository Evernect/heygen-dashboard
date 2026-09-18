"use strict"

const { prisma } = require("../../lib/prisma")
const { getSettings } = require("../settings.service")
const { syncMetricsForUser } = require("./metrics-sync.service")
const {
  recomputePerformance,
  tagUntaggedScripts,
} = require("./performance.service")
const { runStyleAnalysis } = require("./style-analyst.service")
const { localDateParts } = require("../../utils/timezone")
const { logger } = require("../../utils/logger")

const UNIQUE_VIOLATION = "P2002"

function emptyCounters() {
  return {
    postsPolled: 0,
    postsFailed: 0,
    metricsWritten: 0,
    scriptsTagged: 0,
    scriptsScored: 0,
    sampleSize: 0,
  }
}

async function claimRun({ userId, localDate, kind, trigger, force }) {
  try {
    const run = await prisma.insightsRun.create({
      data: { userId, localDate, kind, trigger, status: "RUNNING" },
    })
    return { run, claimed: true }
  } catch (error) {
    if (error?.code !== UNIQUE_VIOLATION) throw error

    const existing = await prisma.insightsRun.findUnique({
      where: { userId_localDate_kind: { userId, localDate, kind } },
    })

    if (!force) return { run: existing, claimed: false }

    const run = await prisma.insightsRun.update({
      where: { id: existing.id },
      data: {
        status: "RUNNING",
        trigger,
        attempt: { increment: 1 },
        startedAt: new Date(),
        finishedAt: null,
        error: null,
        warnings: [],
        playbookId: null,
        ...emptyCounters(),
      },
    })

    return { run, claimed: true }
  }
}

async function finishRun(runId, { status, counters, warnings, error, playbookId }) {
  return prisma.insightsRun.update({
    where: { id: runId },
    data: {
      status,
      finishedAt: new Date(),
      warnings: warnings ?? [],
      error: error ?? null,
      ...(playbookId ? { playbookId } : {}),
      ...(counters ?? {}),
    },
  })
}

async function runMetricsSweepForUser({ userId, trigger = "CRON", force = false }) {
  const profile = await prisma.campaignProfile.findUnique({ where: { userId } })
  const { localDate } = localDateParts(new Date(), profile?.timezone ?? "UTC")

  const { run, claimed } = await claimRun({
    userId,
    localDate,
    kind: "METRICS",
    trigger,
    force,
  })

  if (!claimed) {
    return { status: "SKIPPED", reason: "Already run today", run }
  }

  const counters = emptyCounters()
  const warnings = []

  try {
    const sync = await syncMetricsForUser(userId)
    Object.assign(counters, sync.counters)
    warnings.push(...sync.warnings)

    const scored = await recomputePerformance(userId)
    counters.scriptsScored = scored.scriptsScored
    counters.sampleSize = scored.sampleSize

    const settings = await getSettings(userId)
    const tagged = await tagUntaggedScripts({
      userId,
      settings,
      candidateName: profile?.candidateName ?? null,
    })
    counters.scriptsTagged = tagged.scriptsTagged
    warnings.push(...tagged.warnings)

    await finishRun(run.id, {
      status: warnings.length ? "PARTIAL" : "SUCCEEDED",
      counters,
      warnings,
    })

    logger.info(
      `Metrics sweep ${run.id}: ${counters.metricsWritten} reading(s), ${counters.scriptsScored} scored, ${counters.scriptsTagged} tagged`
    )

    return { status: "SUCCEEDED", run, counters }
  } catch (error) {
    logger.error(`Metrics sweep ${run.id} failed`, error)

    await finishRun(run.id, {
      status: "FAILED",
      counters,
      warnings,
      error: error.message?.slice(0, 1000),
    })

    return { status: "FAILED", run, error }
  }
}

async function runAnalysisForUser({ userId, trigger = "CRON", force = false }) {
  const profile = await prisma.campaignProfile.findUnique({ where: { userId } })
  const { localDate } = localDateParts(new Date(), profile?.timezone ?? "UTC")

  const { run, claimed } = await claimRun({
    userId,
    localDate,
    kind: "ANALYSIS",
    trigger,
    force,
  })

  if (!claimed) {
    return { status: "SKIPPED", reason: "Already run today", run }
  }

  const counters = emptyCounters()

  try {
    const settings = await getSettings(userId)
    const result = await runStyleAnalysis({
      userId,
      runId: run.id,
      settings,
      localDate,
    })

    counters.sampleSize = result.sampleSize

    await finishRun(run.id, {
      status: result.warnings.length ? "PARTIAL" : "SUCCEEDED",
      counters,
      warnings: result.warnings,
      playbookId: result.playbook?.id,
    })

    return { status: "SUCCEEDED", run, playbook: result.playbook }
  } catch (error) {
    logger.error(`Style analysis ${run.id} failed`, error)

    await finishRun(run.id, {
      status: "FAILED",
      counters,
      error: error.message?.slice(0, 1000),
    })

    return { status: "FAILED", run, error }
  }
}

const RUNNERS = {
  METRICS: runMetricsSweepForUser,
  ANALYSIS: runAnalysisForUser,
}

async function findTenantsDueNow(kind, now = new Date()) {
  const profiles = await prisma.campaignProfile.findMany({
    where: { insightsEnabled: true },
  })

  const reached = profiles
    .map((profile) => ({ profile, ...localDateParts(now, profile.timezone) }))
    .filter((entry) => {
      if (kind === "ANALYSIS") {
        const weekday = new Date(`${entry.localDate}T00:00:00Z`).getUTCDay()
        if (weekday !== entry.profile.analysisWeekday) return false
        return entry.hour >= entry.profile.analysisRunHour
      }
      return entry.hour >= entry.profile.metricsRunHour
    })

  if (!reached.length) return []

  const runs = await prisma.insightsRun.findMany({
    where: {
      kind,
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

async function runDueInsightsRuns(now = new Date()) {
  const results = []
  let considered = 0

  for (const kind of ["METRICS", "ANALYSIS"]) {
    const due = await findTenantsDueNow(kind, now)
    considered += due.length

    if (due.length) {
      logger.info(`Insights sweep: ${due.length} tenant(s) due for ${kind}`)
    }

    for (const profile of due) {
      try {
        const result = await RUNNERS[kind]({
          userId: profile.userId,
          trigger: "CRON",
        })
        results.push({ userId: profile.userId, kind, status: result.status })
      } catch (error) {
        logger.error(`${kind} run threw for ${profile.userId}`, error)
        results.push({ userId: profile.userId, kind, status: "FAILED" })
      }
    }
  }

  return { considered, ran: results.length, results }
}

module.exports = {
  runMetricsSweepForUser,
  runAnalysisForUser,
  runDueInsightsRuns,
  findTenantsDueNow,
}
