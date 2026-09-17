"use strict"

const { Router } = require("express")

const controller = require("../controllers/integrations.controller")
const { requireUser } = require("../middleware/auth")
const { asyncHandler } = require("../utils/errors")

const router = Router()

// The HeyGen half is the caller's own connection, so this needs an identity
// even though the Meta half is the same for everyone.
router.use(requireUser)

router.get("/", asyncHandler(controller.readIntegrations))

module.exports = router
