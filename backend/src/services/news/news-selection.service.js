"use strict"

const { runStructured } = require("../openai-client")
const { logger } = require("../../utils/logger")
const {
  buildNewsSelectionPrompt,
  buildNewsSelectionSchema,
  pickKeys,
} = require("../prompts/news-selection.prompt")

/**
 * Asks the model which of the day's clusters are worth a video.
 *
 * Returns between zero and `maxPicks` picks. Zero is a legitimate answer on a
 * day when nothing clears the exclusions, and is much better than three padded
 * ones — the prompt says so and the schema makes declining a slot legal.
 */
async function selectTopics({
  userId,
  profile,
  context,
  maxPicks = 3,
  settings,
}) {
  const prompt = buildNewsSelectionPrompt({
    profile,
    positionsBlock: context.positionsBlock,
    candidatesJson: context.candidatesJson,
    maxPicks,
  })

  const output = await runStructured({
    userId,
    settings,
    prompt,
    schemaName: "news_topic_selection",
    schema: buildNewsSelectionSchema({
      maxPicks,
      candidateIds: context.candidateIds,
    }),
    label: "News topic selection",
  })

  const picks = pickKeys(maxPicks)
    .map((key) => output[key])
    .filter((pick) => pick && String(pick.id ?? "").trim() !== "")
    .map((pick) => ({
      id: String(pick.id).trim(),
      topic: String(pick.topic ?? "").trim(),
      why_now: String(pick.why_now ?? "").trim(),
      importance: pick.importance ?? "Medium",
      importance_score: Number(pick.importance_score) || 0,
      source_summary: String(pick.source_summary ?? "").trim(),
    }))
    .filter((pick) => pick.topic)

  logger.info(
    `Selector returned ${picks.length} topic(s) from ${context.candidateIds.length} candidate(s)`
  )

  return picks
}

module.exports = { selectTopics }
