"use strict"

const { Router } = require("express")

const controller = require("../controllers/heygen-connection.controller")
const { requireUser } = require("../middleware/auth")
const { validate } = require("../middleware/validate")
const { asyncHandler } = require("../utils/errors")

const router = Router()

router.use(requireUser)

router.get("/connection", asyncHandler(controller.readConnection))

router.put(
  "/connection",
  validate(controller.schemas.connectSchema),
  asyncHandler(controller.saveConnection)
)

router.delete("/connection", asyncHandler(controller.removeConnection))

module.exports = router
