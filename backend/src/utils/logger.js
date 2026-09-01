"use strict"

const { env } = require("../lib/env")

function timestamp() {
  return new Date().toISOString()
}

function write(level, message, meta) {
  const line = `${timestamp()} [${level}] ${message}`
  const stream = level === "ERROR" || level === "WARN" ? console.error : console.log

  if (meta === undefined) stream(line)
  else stream(line, meta)
}

const logger = {
  info: (message, meta) => write("INFO", message, meta),
  warn: (message, meta) => write("WARN", message, meta),
  error: (message, meta) => write("ERROR", message, meta),
  debug: (message, meta) => {
    if (!env.isProduction) write("DEBUG", message, meta)
  },
}

module.exports = { logger }
