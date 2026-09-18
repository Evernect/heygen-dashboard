"use strict"

const { prisma } = require("../../lib/prisma")

const VOICE_EXAMPLE_LIMIT = 18

const ARTICLE_TEXT_LIMIT = 2500

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
    where: { userId, isActive: true, source: "MANUAL" },
    orderBy: { createdAt: "desc" },
    select: { guidance: true },
  })

  return latest?.guidance ?? ""
}

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
