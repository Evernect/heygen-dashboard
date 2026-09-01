"use strict"

const { PrismaPg } = require("@prisma/adapter-pg")
const { PrismaClient } = require("./generated")

require("dotenv/config")

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

/** A few content bank entries so a fresh database isn't empty to click through. */
const TOPICS = [
  {
    issue: "Rising utility rates across the district",
    angle:
      "I want an independent audit of the rate increase before another dollar comes out of residents' pockets.",
  },
  {
    issue: "Unsafe crossing outside the elementary school",
    angle:
      "I am asking for a signalised crossing before the start of the next school year.",
  },
  {
    issue: "Backlog in local permit approvals",
    angle:
      "I want published turnaround times so small businesses know what to expect.",
  },
]

async function main() {
  for (const topic of TOPICS) {
    const existing = await prisma.topic.findFirst({
      where: { issue: topic.issue },
    })

    if (existing) {
      console.log(`Skipping (already present): ${topic.issue}`)
      continue
    }

    await prisma.topic.create({ data: topic })
    console.log(`Created: ${topic.issue}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
