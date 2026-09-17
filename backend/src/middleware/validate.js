"use strict"

const { badRequest } = require("../utils/errors")

function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }))

      return next(badRequest("Validation failed", details))
    }

    if (source === "query") req.validatedQuery = result.data
    else req[source] = result.data

    next()
  }
}

module.exports = { validate }
