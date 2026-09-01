"use strict"

const { Router } = require("express")

const controller = require("../controllers/scripts.controller")
const { validate } = require("../middleware/validate")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.get(
  "/",
  validate(controller.schemas.listScriptsQuerySchema, "query"),
  asyncHandler(controller.listScripts)
)

router.get("/:id", asyncHandler(controller.getScript))

router.patch(
  "/:id",
  validate(controller.schemas.updateScriptSchema),
  asyncHandler(controller.updateScript)
)

router.post(
  "/:id/approve",
  validate(controller.schemas.approveScriptSchema),
  asyncHandler(controller.approveScript)
)

router.post(
  "/:id/reject",
  validate(controller.schemas.rejectScriptSchema),
  asyncHandler(controller.rejectScript)
)

router.post("/:id/retry", asyncHandler(controller.retryScript))

module.exports = router
