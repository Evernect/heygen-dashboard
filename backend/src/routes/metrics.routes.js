"use strict"

const { Router } = require("express")

const controller = require("../controllers/metrics.controller")
const { requireUser } = require("../middleware/auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

// Aggregates and insights only ever cover the caller's own published work.
router.use(requireUser)

router.get("/metrics/summary", asyncHandler(controller.getSummary))
router.get("/insights", asyncHandler(controller.listInsights))

module.exports = router
