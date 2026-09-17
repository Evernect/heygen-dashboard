"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const { generateForTopic } = require("../services/script-generation.service")
const { conflict, notFound } = require("../utils/errors")

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

/**
 * Scopes a lookup by id to the caller.
 *
 * `findFirst` rather than `findUnique`: a unique lookup can only match on the
 * id, so it would hand back another tenant's topic and leave the ownership
 * check to the caller. Folding the owner into the query means someone else's
 * id is simply not found.
 */
function owned(req) {
  return { id: req.params.id, userId: req.user.id }
}

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

  // MANUAL only: topics materialised by a daily news item live on the Daily
  // News screen, and the content bank is for what a person put there.
  const where = {
    userId: req.user.id,
    source: "MANUAL",
    ...(status ? { status } : {}),
  }

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
  const topic = await prisma.topic.create({
    data: { ...req.body, userId: req.user.id },
  })
  res.status(201).json(topic)
}

async function bulkCreateTopics(req, res) {
  const created = await prisma.topic.createManyAndReturn({
    data: req.body.topics.map((topic) => ({ ...topic, userId: req.user.id })),
  })
  res.status(201).json({ created, count: created.length })
}

async function updateTopic(req, res) {
  const existing = await prisma.topic.findFirst({ where: owned(req) })
  if (!existing) throw notFound("Topic not found")

  const topic = await prisma.topic.update({
    where: { id: req.params.id },
    data: req.body,
  })

  res.json(topic)
}

async function deleteTopic(req, res) {
  const existing = await prisma.topic.findFirst({
    where: owned(req),
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

// Runs the LLM for one topic, producing several options to pick from
async function generateFromTopic(req, res) {
  const scripts = await generateForTopic({
    topicId: req.params.id,
    userId: req.user.id,
  })

  res.status(201).json({ scripts, count: scripts.length })
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
