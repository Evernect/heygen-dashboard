"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const { generateScriptVariants } = require("../services/llm.service")
const { conflict, notFound } = require("../utils/errors")
const { logger } = require("../utils/logger")

const TOPIC_STATUSES = ["IDLE", "GENERATING", "GENERATED", "ERROR"]

const createTopicSchema = z.object({
  issue: z.string().trim().min(3, "Issue must be at least 3 characters"),
  angle: z.string().trim().min(3, "Angle must be at least 3 characters"),
})

const updateTopicSchema = createTopicSchema.partial()

const MAX_BULK_ROWS = 200

const bulkCreateTopicsSchema = z.object({
  topics: z
    .array(createTopicSchema)
    .min(1, "Provide at least one topic")
    .max(MAX_BULK_ROWS, `Cannot import more than ${MAX_BULK_ROWS} topics at once`),
})

const DEFAULT_TOPICS_PAGE_SIZE = 20

const listTopicsQuerySchema = z.object({
  status: z.enum(TOPIC_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(DEFAULT_TOPICS_PAGE_SIZE),
})

async function listTopics(req, res) {
  const {
    status,
    page = 1,
    pageSize = DEFAULT_TOPICS_PAGE_SIZE,
  } = req.validatedQuery ?? {}

  const where = status ? { status } : undefined

  const [topics, total] = await prisma.$transaction([
    prisma.topic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.topic.count({ where }),
  ])

  res.json({ topics, total, page, pageSize })
}

async function createTopic(req, res) {
  const topic = await prisma.topic.create({ data: req.body })
  res.status(201).json(topic)
}

async function bulkCreateTopics(req, res) {
  const created = await prisma.topic.createManyAndReturn({ data: req.body.topics })
  res.status(201).json({ created, count: created.length })
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

  if (existing._count.scripts > 0) {
    throw conflict(
      `This topic has ${existing._count.scripts} generated script(s) and cannot be deleted.`
    )
  }

  await prisma.topic.delete({ where: { id: req.params.id } })
  res.status(204).send()
}

const IN_FLIGHT_SCRIPT_STATUSES = [
  "RENDERING",
  "PENDING_REVIEW",
  "APPROVED",
  "PROCESSING",
]

// Runs the LLM for one topic, producing several options to pick from
async function generateFromTopic(req, res) {
  const topic = await prisma.topic.findUnique({ where: { id: req.params.id } })
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
    })

    const [, scripts] = await prisma.$transaction([
      prisma.script.deleteMany({
        where: { topicId: topic.id, status: "DRAFT" },
      }),
      prisma.script.createManyAndReturn({
        data: generated.map((variant) => ({
          ...variant,
          topicId: topic.id,
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
    res.status(201).json({ scripts, count: scripts.length })
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
  bulkCreateTopics,
  updateTopic,
  deleteTopic,
  generateFromTopic,
  schemas: {
    createTopicSchema,
    bulkCreateTopicsSchema,
    updateTopicSchema,
    listTopicsQuerySchema,
  },
}
