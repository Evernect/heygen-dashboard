"use strict"

const { Router } = require("express")

const controller = require("../controllers/integrations.controller")
const { requireUser } = require("../middleware/auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.use(requireUser)

router.get("/", asyncHandler(controller.readIntegrations))

module.exports = router
