"use strict"

const cors = require("cors")
const express = require("express")

const { env } = require("./lib/env")
const { errorHandler, notFoundHandler } = require("./middleware/error-handler")
const cronRoutes = require("./routes/cron.routes")
const metricsRoutes = require("./routes/metrics.routes")
const scriptsRoutes = require("./routes/scripts.routes")
const topicsRoutes = require("./routes/topics.routes")
const { logger } = require("./utils/logger")

const app = express()

app.disable("x-powered-by")
app.use(
  cors({
    origin: env.corsOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  })
)
app.use(express.json({ limit: "1mb" }))

app.get("/health", (req, res) => {
  res.json({ status: "ok", environment: env.NODE_ENV })
})

app.use("/api/topics", topicsRoutes)
app.use("/api/scripts", scriptsRoutes)
app.use("/api/cron", cronRoutes)
app.use("/api", metricsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

if (require.main === module) {
  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`)
    logger.info(`Allowed origins: ${env.corsOrigins.join(", ")}`)
    if (env.DRY_RUN_HEYGEN) logger.warn("DRY_RUN_HEYGEN is on — no videos will be rendered")
    if (env.DRY_RUN_META) logger.warn("DRY_RUN_META is on — nothing will be posted to social platforms")
  })
}

module.exports = app
