"use strict"

const { Router } = require("express")

const controller = require("../controllers/settings.controller")
const { requireUser } = require("../middleware/auth")
const { validate } = require("../middleware/validate")
const { asyncHandler } = require("../utils/errors")

const router = Router()

// Settings and the avatar catalogue are both per-user: the first is the
// caller's own row, the second is read with the caller's HeyGen key.
router.use(requireUser)

router.get("/", asyncHandler(controller.readSettings))

router.patch(
  "/",
  validate(controller.schemas.updateSettingsSchema),
  asyncHandler(controller.writeSettings)
)

router.get(
  "/heygen/avatar-groups",
  validate(controller.schemas.heygenListQuerySchema, "query"),
  asyncHandler(controller.listAvatarGroups)
)

router.get(
  "/heygen/avatar-looks",
  validate(controller.schemas.heygenListQuerySchema, "query"),
  asyncHandler(controller.listAvatarLooks)
)

router.get("/openai/models", asyncHandler(controller.listOpenAiModels))

module.exports = router
