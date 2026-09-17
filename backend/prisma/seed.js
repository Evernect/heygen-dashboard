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

/**
 * Topics belong to a tenant, so seeding needs to know whose bank to fill.
 * Pass the Supabase user id as an argument or as SEED_USER_ID:
 *
 *   npm run db:seed -- <user-id>
 *
 * Find it in the Supabase dashboard, or with:
 *   select id, email from auth.users order by created_at;
 */
function resolveUserId() {
  const userId = process.argv[2] ?? process.env.SEED_USER_ID

  if (!userId) {
    throw new Error(
      "No user to seed for. Pass one as `npm run db:seed -- <user-id>`, or set SEED_USER_ID. " +
        "Find it with: select id, email from auth.users order by created_at;"
    )
  }

  return userId
}

async function main() {
  const userId = resolveUserId()

  for (const topic of TOPICS) {
    // Scoped by owner: the same example issue in another tenant's bank is a
    // different topic, not a duplicate.
    const existing = await prisma.topic.findFirst({
      where: { issue: topic.issue, userId },
    })

    if (existing) {
      console.log(`Skipping (already present): ${topic.issue}`)
      continue
    }

    await prisma.topic.create({ data: { ...topic, userId } })
    console.log(`Created: ${topic.issue}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
