"use strict"

const { Router } = require("express")

const controller = require("../controllers/metrics.controller")
const { validate } = require("../middleware/validate")
const { requireUser } = require("../middleware/auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.use(requireUser)

router.get("/metrics/summary", asyncHandler(controller.getSummary))

router.get("/insights/runs/latest", asyncHandler(controller.latestRun))
router.get("/insights/runs", asyncHandler(controller.listRuns))

router.post(
  "/insights/run",
  validate(controller.schemas.runSchema),
  asyncHandler(controller.runNow)
)

router.get(
  "/insights/performance",
  validate(controller.schemas.performanceQuerySchema, "query"),
  asyncHandler(controller.listScriptPerformance)
)

router.get("/insights", asyncHandler(controller.listInsights))

module.exports = router
