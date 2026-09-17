"use strict"

const { Router } = require("express")

const controller = require("../controllers/topics.controller")
const { validate } = require("../middleware/validate")
const { requireUser } = require("../middleware/auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

// A content bank belongs to one tenant, so every route here needs to know
// who is asking.
router.use(requireUser)

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
