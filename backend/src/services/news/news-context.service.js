"use strict"

const { prisma } = require("../../lib/prisma")

/** How many issue/angle pairs are shown to the angle writer as voice reference. */
const VOICE_EXAMPLE_LIMIT = 18

/** How much of an article the selector is given per story. */
const ARTICLE_TEXT_LIMIT = 2500

/**
 * The candidate's own past work, as voice reference.
 *
 * MANUAL only, and that filter is load-bearing: a topic the pipeline generated
 * also accumulates `timesUsed`, so without it the voice reference would
 * eventually be made of the model's own earlier output and drift away from the
 * candidate a little more each week.
 */
async function loadVoiceExamples(userId, limit = VOICE_EXAMPLE_LIMIT) {
  const topics = await prisma.topic.findMany({
    where: { userId, source: "MANUAL" },
    orderBy: [{ timesUsed: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: { issue: true, angle: true },
  })

  return topics
    .map((topic) => `ISSUE: ${topic.issue}\nANGLE: ${topic.angle}`)
    .join("\n\n")
}

async function loadPositionsBlock(userId) {
  const positions = await prisma.candidatePosition.findMany({
    where: { userId, active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { issue: true, stance: true },
  })

  return positions
    .map((position) => `- ${position.issue}: ${position.stance}`)
    .join("\n")
}

async function loadGuidance(userId) {
  const latest = await prisma.stylePlaybook.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { guidance: true },
  })

  return latest?.guidance ?? ""
}

/**
 * The candidate shape the selector reads. Article text is attached only when it
 * was actually usable, so an empty string is the model's signal to summarise
 * from headlines and say so.
 */
function buildCandidates(clusters, articleTexts) {
  return clusters.map((cluster, index) => ({
    id: cluster.clusterId,
    cluster_title: cluster.clusterTitle,
    topic_labels: cluster.topicLabels,
    score: cluster.score,
    outlet_count: cluster.outletCount,
    hours_old: cluster.hoursOld,
    is_district: cluster.isDistrict,
    is_named: cluster.isNamed,
    headlines: cluster.headlines,
    article_text: (articleTexts?.[index] ?? "").slice(0, ARTICLE_TEXT_LIMIT),
  }))
}

/** Everything the two LLM stages need, read in one place. */
async function buildNewsContext({ userId, clusters, articleTexts }) {
  const [voiceExamples, positionsBlock, guidanceText] = await Promise.all([
    loadVoiceExamples(userId),
    loadPositionsBlock(userId),
    loadGuidance(userId),
  ])

  const candidates = buildCandidates(clusters, articleTexts)

  return {
    candidates,
    candidatesJson: JSON.stringify(candidates, null, 1),
    candidateIds: candidates.map((candidate) => candidate.id),
    withTextCount: candidates.filter((candidate) => candidate.article_text).length,
    voiceExamples,
    positionsBlock,
    guidanceText,
  }
}

module.exports = {
  buildNewsContext,
  buildCandidates,
  loadVoiceExamples,
  loadPositionsBlock,
  loadGuidance,
  VOICE_EXAMPLE_LIMIT,
}
