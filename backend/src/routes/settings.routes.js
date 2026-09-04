"use strict"

const { Router } = require("express")

const controller = require("../controllers/settings.controller")
const { validate } = require("../middleware/validate")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.get("/", asyncHandler(controller.readSettings))

router.patch(
  "/",
  validate(controller.schemas.updateSettingsSchema),
  asyncHandler(controller.writeSettings)
)

router.get(
  "/heygen/avatar-looks",
  validate(controller.schemas.heygenListQuerySchema, "query"),
  asyncHandler(controller.listAvatarLooks)
)

router.get(
  "/heygen/voices",
  validate(controller.schemas.heygenListQuerySchema, "query"),
  asyncHandler(controller.listVoices)
)

router.get("/openai/models", asyncHandler(controller.listOpenAiModels))

module.exports = router
