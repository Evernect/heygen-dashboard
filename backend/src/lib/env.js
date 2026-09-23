"use strict"

require("dotenv/config")
const { z } = require("zod")

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("videos"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.4-mini"),

  HEYGEN_API_KEY: z.string().optional(),
  HEYGEN_AVATAR_ID: z.string().optional(),

  JINA_API_KEY: z.string().optional(),

  FACEBOOK_PAGE_ID: z.string().optional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional(),
  META_PAGE_ACCESS_TOKEN: z.string().optional(),

  CRON_SECRET: z.string().optional(),

  CREDENTIAL_ENCRYPTION_KEY: z.string().optional(),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n")

  console.error(
    `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill it in.`
  )
  process.exit(1)
}

const env = parsed.data

env.corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

env.isProduction = env.NODE_ENV === "production"

function requireEnv(...keys) {
  const missing = keys.filter((key) => !env[key])
  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}`
    )
  }
  return keys.map((key) => env[key])
}

module.exports = { env, requireEnv }
