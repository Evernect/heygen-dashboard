"use strict"

const { prisma } = require("../lib/prisma")
const { generateScriptVariants } = require("./llm.service")
const { conflict, notFound } = require("../utils/errors")
const { logger } = require("../utils/logger")

const IN_FLIGHT_SCRIPT_STATUSES = [
  "RENDERING",
  "PENDING_REVIEW",
  "APPROVED",
  "PROCESSING",
]

async function generateForTopic({ topicId, userId }) {
  const topic = await prisma.topic.findFirst({ where: { id: topicId, userId } })
  if (!topic) throw notFound("Topic not found")

  if (topic.status === "GENERATING") {
    throw conflict("Scripts are already being generated for this topic.")
  }

  const inFlight = await prisma.script.findFirst({
    where: { topicId: topic.id, status: { in: IN_FLIGHT_SCRIPT_STATUSES } },
  })

  if (inFlight) {
    throw conflict(
      `This topic already has a script that is ${inFlight.status.toLowerCase().replace("_", " ")}. Finish or disapprove it before generating new ones.`
    )
  }

  await prisma.topic.update({
    where: { id: topic.id },
    data: {
      status: "GENERATING",
      generateRequestedAt: new Date(),
      generateError: null,
    },
  })

  try {
    const generated = await generateScriptVariants({
      issue: topic.issue,
      angle: topic.angle,
      userId: topic.userId,
    })

    const [, scripts] = await prisma.$transaction([
      prisma.script.deleteMany({
        where: { topicId: topic.id, status: "DRAFT" },
      }),
      prisma.script.createManyAndReturn({
        data: generated.map((variant) => ({
          ...variant,
          topicId: topic.id,
          userId: topic.userId,
          status: "DRAFT",
        })),
      }),
      prisma.topic.update({
        where: { id: topic.id },
        data: {
          status: "GENERATED",
          timesUsed: { increment: 1 },
          lastUsedAt: new Date(),
          generateError: null,
        },
      }),
    ])

    logger.info(
      `Generated ${scripts.length} script option(s) for topic ${topic.id}`
    )
    return scripts
  } catch (error) {
    await prisma.topic.update({
      where: { id: topic.id },
      data: { status: "ERROR", generateError: error.message?.slice(0, 500) },
    })
    throw error
  }
}

module.exports = { generateForTopic, IN_FLIGHT_SCRIPT_STATUSES }
