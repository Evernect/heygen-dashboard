"use strict"

const { Router } = require("express")

const controller = require("../controllers/topics.controller")
const { validate } = require("../middleware/validate")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.get(
  "/",
  validate(controller.schemas.listTopicsQuerySchema, "query"),
  asyncHandler(controller.listTopics)
)

router.post(
  "/",
  validate(controller.schemas.createTopicSchema),
  asyncHandler(controller.createTopic)
)

router.post(
  "/bulk",
  validate(controller.schemas.bulkCreateTopicsSchema),
  asyncHandler(controller.bulkCreateTopics)
)

router.patch(
  "/:id",
  validate(controller.schemas.updateTopicSchema),
  asyncHandler(controller.updateTopic)
)

router.delete("/:id", asyncHandler(controller.deleteTopic))

router.post("/:id/generate", asyncHandler(controller.generateFromTopic))

module.exports = router
