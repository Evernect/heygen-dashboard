"use strict"

require("dotenv/config")
const { z } = require("zod")

// Environment contract, validated once at boot.
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
  HEYGEN_VOICE_ID: z.string().optional(),

  FACEBOOK_PAGE_ID: z.string().optional(),
  FACEBOOK_PAGE_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_BUSINESS_ACCOUNT_ID: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),

  CRON_SECRET: z.string().optional(),

  DRY_RUN_HEYGEN: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
  DRY_RUN_META: z
    .string()
    .default("false")
    .transform((value) => value.toLowerCase() === "true"),
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

// Comma-separated CORS_ORIGIN into an array, for multiple deploy origins
env.corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

env.isProduction = env.NODE_ENV === "production"

// Error when a feature is used without its credentials
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
