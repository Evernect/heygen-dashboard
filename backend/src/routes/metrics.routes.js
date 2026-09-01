"use strict"

const { Router } = require("express")

const controller = require("../controllers/metrics.controller")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.get("/metrics/summary", asyncHandler(controller.getSummary))
router.get("/insights", asyncHandler(controller.listInsights))

module.exports = router
