"use strict"

const { Router } = require("express")

const controller = require("../controllers/cron.controller")
const { cronAuth } = require("../middleware/cron-auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.use(cronAuth)

router.post("/publish-due", asyncHandler(controller.publishDue))

module.exports = router
