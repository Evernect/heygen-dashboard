"use strict"

class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.details = details
  }
}

const badRequest = (message, details) => new HttpError(400, message, details)
const unauthorized = (message = "Unauthorized") => new HttpError(401, message)
const notFound = (message = "Not found") => new HttpError(404, message)
const conflict = (message, details) => new HttpError(409, message, details)
const serviceUnavailable = (message, details) =>
  new HttpError(503, message, details)

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

module.exports = {
  HttpError,
  badRequest,
  unauthorized,
  notFound,
  conflict,
  serviceUnavailable,
  asyncHandler,
}
