"use strict"

const { HttpError } = require("../utils/errors")
const { logger } = require("../utils/logger")
const { env } = require("../lib/env")

function notFoundHandler(req, res) {
  res.status(404).json({ message: `No route for ${req.method} ${req.path}` })
}

function errorHandler(error, req, res, next) {
  const status = error instanceof HttpError ? error.status : 500

  if (status >= 500) {
    logger.error(`${req.method} ${req.path} failed`, error)
  } else {
    logger.warn(`${req.method} ${req.path} -> ${status}: ${error.message}`)
  }

  res.status(status).json({
    message:
      status >= 500 && env.isProduction
        ? "Internal server error"
        : error.message,
    ...(error.details ? { details: error.details } : {}),
  })
}

module.exports = { errorHandler, notFoundHandler }
