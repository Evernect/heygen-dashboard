"use strict"

const { Router } = require("express")

const controller = require("../controllers/daily-news.controller")
const { validate } = require("../middleware/validate")
const { requireUser } = require("../middleware/auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.use(requireUser)

router.get("/runs/latest", asyncHandler(controller.latestRun))
router.get("/runs", asyncHandler(controller.listRuns))

router.post(
  "/run",
  validate(controller.schemas.runSchema),
  asyncHandler(controller.runNow)
)

router.get(
  "/",
  validate(controller.schemas.listQuerySchema, "query"),
  asyncHandler(controller.listDailyNews)
)

router.patch(
  "/:id",
  validate(controller.schemas.updateItemSchema),
  asyncHandler(controller.updateDailyNewsItem)
)

router.post("/:id/generate", asyncHandler(controller.generateFromDailyNewsItem))
router.post("/:id/dismiss", asyncHandler(controller.dismissDailyNewsItem))
router.delete("/:id", asyncHandler(controller.deleteDailyNewsItem))

module.exports = router
