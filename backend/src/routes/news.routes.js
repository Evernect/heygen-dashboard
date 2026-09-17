"use strict"

const { Router } = require("express")

const controller = require("../controllers/news.controller")
const { validate } = require("../middleware/validate")
const { requireUser } = require("../middleware/auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.use(requireUser)

router.get("/keywords", asyncHandler(controller.listKeywords))

router.post(
  "/keywords",
  validate(controller.schemas.createKeywordSchema),
  asyncHandler(controller.createKeyword)
)

router.post(
  "/keywords/bulk",
  validate(controller.schemas.bulkKeywordsSchema),
  asyncHandler(controller.bulkUpsertKeywords)
)

router.patch(
  "/keywords/:id",
  validate(controller.schemas.updateKeywordSchema),
  asyncHandler(controller.updateKeyword)
)

router.delete("/keywords/:id", asyncHandler(controller.deleteKeyword))

router.get("/campaign-profile", asyncHandler(controller.readCampaignProfile))

router.put(
  "/campaign-profile",
  validate(controller.schemas.campaignProfileSchema),
  asyncHandler(controller.writeCampaignProfile)
)

router.get("/positions", asyncHandler(controller.listPositions))

router.post(
  "/positions",
  validate(controller.schemas.createPositionSchema),
  asyncHandler(controller.createPosition)
)

router.post(
  "/positions/bulk",
  validate(controller.schemas.bulkPositionsSchema),
  asyncHandler(controller.bulkUpsertPositions)
)

router.patch(
  "/positions/:id",
  validate(controller.schemas.updatePositionSchema),
  asyncHandler(controller.updatePosition)
)

router.delete("/positions/:id", asyncHandler(controller.deletePosition))

router.get("/style-playbook", asyncHandler(controller.listPlaybook))

router.post(
  "/style-playbook",
  validate(controller.schemas.createPlaybookSchema),
  asyncHandler(controller.createPlaybookEntry)
)

router.delete("/style-playbook/:id", asyncHandler(controller.deletePlaybookEntry))

module.exports = router
