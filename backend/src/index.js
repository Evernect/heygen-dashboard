"use strict"

const cors = require("cors")
const express = require("express")

const { env } = require("./lib/env")
const { errorHandler, notFoundHandler } = require("./middleware/error-handler")
const { attachUser } = require("./middleware/auth")
const cronRoutes = require("./routes/cron.routes")
const dailyNewsRoutes = require("./routes/daily-news.routes")
const heygenRoutes = require("./routes/heygen.routes")
const integrationsRoutes = require("./routes/integrations.routes")
const metricsRoutes = require("./routes/metrics.routes")
const newsRoutes = require("./routes/news.routes")
const scriptsRoutes = require("./routes/scripts.routes")
const settingsRoutes = require("./routes/settings.routes")
const topicsRoutes = require("./routes/topics.routes")
const { clearJobRoot } = require("./services/captions/caption-burner.service")
const { logger } = require("./utils/logger")

const app = express()

app.disable("x-powered-by")
app.use(
  cors({
    origin: env.corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-cron-secret"],
  })
)
app.use(express.json({ limit: "1mb" }))

app.use("/api", attachUser)

app.get("/health", (req, res) => {
  res.json({ status: "ok", environment: env.NODE_ENV })
})

app.use("/api/topics", topicsRoutes)
app.use("/api/news", newsRoutes)
app.use("/api/daily-news", dailyNewsRoutes)
app.use("/api/scripts", scriptsRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/heygen", heygenRoutes)
app.use("/api/integrations", integrationsRoutes)
app.use("/api/cron", cronRoutes)
app.use("/api", metricsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

if (require.main === module) {
  clearJobRoot().catch((error) => {
    logger.warn(`Could not clear leftover caption jobs: ${error.message}`)
  })

  app.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT}`)
    logger.info(`Allowed origins: ${env.corsOrigins.join(", ")}`)
  })
}

module.exports = app
