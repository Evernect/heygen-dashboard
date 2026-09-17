"use strict"

const { runStructured } = require("../openai-client")
const { logger } = require("../../utils/logger")
const {
  buildNewsAnglesPrompt,
  buildNewsAnglesSchema,
  angleKeys,
} = require("../prompts/news-angles.prompt")

async function writeAngles({ userId, picks, context, settings }) {
  if (!picks.length) return { angles: [], warning: null }

  const topicsJson = JSON.stringify(picks, null, 1)

  try {
    const output = await runStructured({
      userId,
      settings,
      prompt: buildNewsAnglesPrompt({
        voiceExamples: context.voiceExamples,
        positionsBlock: context.positionsBlock,
        guidanceText: context.guidanceText,
        topicsJson,
        count: picks.length,
      }),
      schemaName: "news_angles",
      schema: buildNewsAnglesSchema({
        count: picks.length,
        topicIds: picks.map((pick) => pick.id),
      }),
      label: "Angle writing",
    })

    const written = new Map(
      angleKeys(picks.length)
        .map((key) => output[key])
        .filter((angle) => angle && angle.id)
        .map((angle) => [String(angle.id).trim(), angle])
    )

    const angles = picks.map((pick) => {
      const match = written.get(pick.id)

      return {
        ...pick,
        angle: String(match?.angle ?? "").trim(),
        conflict_flag: String(match?.conflict_flag ?? "").trim(),
      }
    })

    const missing = angles.filter((angle) => !angle.angle).length

    return {
      angles,
      warning: missing
        ? `${missing} topic(s) came back without an angle and need one written by hand.`
        : null,
    }
  } catch (error) {
    logger.error("Angle writing failed; keeping the topics without angles", error)

    return {
      angles: picks.map((pick) => ({ ...pick, angle: "", conflict_flag: "" })),
      warning: `Angles could not be written (${error.message}). The topics were kept so an angle can be added by hand.`,
    }
  }
}

module.exports = { writeAngles }
