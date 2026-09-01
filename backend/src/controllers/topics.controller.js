"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const { generateScript } = require("../services/llm.service")
const { badRequest, conflict, notFound } = require("../utils/errors")
const { logger } = require("../utils/logger")

const TOPIC_STATUSES = ["IDLE", "GENERATING", "GENERATED", "ERROR"]

const createTopicSchema = z.object({
  issue: z.string().trim().min(3, "Issue must be at least 3 characters"),
  angle: z.string().trim().min(3, "Angle must be at least 3 characters"),
})

const updateTopicSchema = createTopicSchema.partial()

const listTopicsQuerySchema = z.object({
  status: z.enum(TOPIC_STATUSES).optional(),
})

async function listTopics(req, res) {
  const { status } = req.validatedQuery ?? {}

  const topics = await prisma.topic.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  })

  res.json(topics)
}

async function createTopic(req, res) {
  const topic = await prisma.topic.create({ data: req.body })
  res.status(201).json(topic)
}

async function updateTopic(req, res) {
  const existing = await prisma.topic.findUnique({
    where: { id: req.params.id },
  })
  if (!existing) throw notFound("Topic not found")

  const topic = await prisma.topic.update({
    where: { id: req.params.id },
    data: req.body,
  })

  res.json(topic)
}

async function deleteTopic(req, res) {
  const existing = await prisma.topic.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { scripts: true } } },
  })
  if (!existing) throw notFound("Topic not found")

  // Deleting would cascade away generated scripts along with their publish
  // history, so refuse rather than silently destroying the record.
  if (existing._count.scripts > 0) {
    throw conflict(
      `This topic has ${existing._count.scripts} generated script(s) and cannot be deleted.`
    )
  }

  await prisma.topic.delete({ where: { id: req.params.id } })
  res.status(204).send()
}

// Runs the LLM for one topic 
async function generateFromTopic(req, res) {
  const topic = await prisma.topic.findUnique({ where: { id: req.params.id } })
  if (!topic) throw notFound("Topic not found")

  if (topic.status === "GENERATING") {
    throw conflict("A script is already being generated for this topic.")
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
    const generated = await generateScript({
      issue: topic.issue,
      angle: topic.angle,
    })

    if (!generated.title || !generated.scriptText) {
      throw badRequest("Model returned an incomplete script")
    }

    // The script row and the topic's usage counters must move together.
    const [script] = await prisma.$transaction([
      prisma.script.create({
        data: { ...generated, topicId: topic.id, status: "PENDING_REVIEW" },
        include: { topic: { select: { id: true, issue: true, angle: true } } },
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

    logger.info(`Generated script ${script.id} for topic ${topic.id}`)
    res.status(201).json(script)
  } catch (error) {
    await prisma.topic.update({
      where: { id: topic.id },
      data: { status: "ERROR", generateError: error.message?.slice(0, 500) },
    })
    throw error
  }
}

module.exports = {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  generateFromTopic,
  schemas: { createTopicSchema, updateTopicSchema, listTopicsQuerySchema },
}
