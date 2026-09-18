"use strict"

const { prisma } = require("../../lib/prisma")
const { runStructured } = require("../openai-client")
const {
  buildStyleAnalystPrompt,
  buildStyleAnalystSchema,
} = require("../prompts/style-analyst.prompt")
const { MIN_SAMPLE_SIZE } = require("./scoring.service")
const { loadAnalystRows } = require("./performance.service")
const { publishGeneratedGuidance } = require("./playbook.service")
const { logger } = require("../../utils/logger")

const INSIGHT_CATEGORY = "style"

function confidenceFor(evidenceCount) {
  if (evidenceCount >= 10) return "high"
  if (evidenceCount >= 7) return "medium"
  return "low"
}

function toInsightRows({ userId, runId, sampleSize, output }) {
  const build = (pattern, kind) => ({
    userId,
    runId,
    category: INSIGHT_CATEGORY,
    subject: pattern.attribute,
    finding: `${kind === "winning" ? "Outperforming" : "Underperforming"}: ${
      pattern.value
    } (${pattern.evidence_count} of ${sampleSize} videos)`,
    recommendation:
      kind === "winning"
        ? `Lean into ${pattern.value} for ${pattern.attribute}.`
        : `Move away from ${pattern.value} for ${pattern.attribute}.`,
    confidence: confidenceFor(pattern.evidence_count),
  })

  return [
    ...(output.winning_patterns ?? []).map((p) => build(p, "winning")),
    ...(output.avoid_patterns ?? []).map((p) => build(p, "avoid")),
  ]
}

async function runStyleAnalysis({ userId, runId, settings, localDate }) {
  const rows = await loadAnalystRows(userId)
  const sampleSize = rows.length

  if (sampleSize < MIN_SAMPLE_SIZE) {
    logger.info(
      `Style analysis for ${userId} skipped: ${sampleSize} of ${MIN_SAMPLE_SIZE} videos needed`
    )

    return {
      sampleSize,
      playbook: null,
      warnings: [
        `Only ${sampleSize} video(s) are settled enough to compare. The analysis needs ${MIN_SAMPLE_SIZE} before it will draw conclusions.`,
      ],
    }
  }

  const output = await runStructured({
    userId,
    settings,
    prompt: buildStyleAnalystPrompt({
      rows,
      sampleSize,
      minSampleSize: MIN_SAMPLE_SIZE,
    }),
    schemaName: "style_analysis",
    schema: buildStyleAnalystSchema(),
    label: "Style analysis",
  })

  const guidance = (output.guidance_text ?? "").trim()

  if (!guidance) {
    return {
      sampleSize,
      playbook: null,
      warnings: [
        "The analysis found nothing that held up consistently across the top and bottom tiers.",
      ],
    }
  }

  const playbook = await publishGeneratedGuidance({
    userId,
    guidance,
    sampleSize,
    runId,
    label: `Auto review ${localDate}`,
  })

  const insights = toInsightRows({ userId, runId, sampleSize, output })

  await prisma.$transaction([
    prisma.insight.deleteMany({ where: { userId, runId: { not: null } } }),
    ...(insights.length
      ? [prisma.insight.createMany({ data: insights })]
      : []),
  ])

  logger.info(
    `Style analysis for ${userId}: ${sampleSize} videos, ${insights.length} pattern(s), playbook ${playbook.id}`
  )

  return { sampleSize, playbook, insights: insights.length, warnings: [] }
}

module.exports = { runStyleAnalysis, confidenceFor, toInsightRows }
