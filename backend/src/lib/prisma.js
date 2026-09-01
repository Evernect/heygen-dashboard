"use strict"

const { PrismaPg } = require("@prisma/adapter-pg")
const { PrismaClient } = require("../../prisma/generated")
const { env } = require("./env")

const globalForPrisma = globalThis

function createClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

  return new PrismaClient({
    adapter,
    log: env.isProduction ? ["error"] : ["warn", "error"],
  })
}

const prisma = globalForPrisma.__prisma ?? createClient()

if (!env.isProduction) {
  globalForPrisma.__prisma = prisma
}

module.exports = { prisma }
