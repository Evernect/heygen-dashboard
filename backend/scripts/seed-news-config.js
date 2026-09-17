"use strict"

/**
 * Seeds one user's news configuration from the original Google Sheets setup:
 * the campaign profile the n8n prompts used to hardcode, the Keywords tab and
 * the Positions tab.
 *
 * Idempotent — every write is an upsert keyed on something stable, so running
 * it twice changes nothing.
 *
 *   npm run news:seed -- <user-id>
 */

const { prisma } = require("../src/lib/prisma")

const PROFILE = {
  candidateName: "Ted Nordblum",
  party: "Republican",
  office: "California State Assembly",
  district: "Assembly District 42",
  districtDescription: "Ventura and western Los Angeles counties",
  districtTerms: [
    "Thousand Oaks",
    "Simi Valley",
    "Moorpark",
    "Camarillo",
    "Malibu",
    "Calabasas",
    "Agoura Hills",
    "Pacific Palisades",
    "Ventura County",
  ],
  state: "California",
  electionDate: new Date("2026-11-03T00:00:00Z"),
  timezone: "America/Los_Angeles",
  newsRunHour: 7,
  topicsPerRun: 3,
  newsEnabled: true,
}

const KEYWORDS = [
  {
    keywordId: "K01",
    type: "issue",
    topicLabel: "Gas tax",
    query: '(gas tax OR "fuel tax" OR "gas prices") California when:1d',
    terms: ["gas tax", "fuel tax", "gas prices", "excise tax", "mileage tax"],
    places: ["California", "Sacramento", "Newsom", "state lawmakers", "statewide"],
    scope: "state",
    priority: 5,
  },
  {
    keywordId: "K02",
    type: "issue",
    topicLabel: "Prop 13 / property tax",
    query: '("Proposition 13" OR "split roll" OR "property tax") California when:1d',
    terms: ["proposition 13", "prop 13", "split roll", "property tax"],
    places: ["California", "Sacramento", "Newsom", "state lawmakers", "statewide"],
    scope: "state",
    priority: 5,
  },
  {
    keywordId: "K03",
    type: "issue",
    topicLabel: "State budget / spending",
    query:
      '("budget deficit" OR "budget shortfall" OR "state spending") California when:1d',
    terms: [
      "budget deficit",
      "budget shortfall",
      "state spending",
      "state budget",
      "surplus",
    ],
    places: ["California", "Sacramento", "Newsom", "state lawmakers", "statewide"],
    scope: "state",
    priority: 4,
  },
]

const POSITIONS = [
  {
    issue: "Gas tax",
    stance:
      "Opposes gas tax increases and the proposed mileage tax; wants to cut the state gas tax.",
    sourceUrl: "https://tednordblum.com/post/Why-Im-Running",
    lastVerifiedAt: new Date("2026-09-14T00:00:00Z"),
  },
  {
    issue: "Prop 13 / property tax",
    stance:
      "Defends Proposition 13 and opposes efforts to weaken its property tax protections.",
    sourceUrl: "https://tednordblum.com/post/Why-Im-Running",
    lastVerifiedAt: new Date("2026-09-14T00:00:00Z"),
  },
  {
    issue: "State budget / spending",
    stance:
      "Wants a balanced state budget, less waste, and government that lives within its means.",
    sourceUrl: "https://tednordblum.com/positions",
    lastVerifiedAt: new Date("2026-09-14T00:00:00Z"),
  },
]

async function main() {
  const userId = process.argv[2]

  if (!userId) {
    console.error("Usage: npm run news:seed -- <user-id>")
    console.error("Find one with: select id, email from auth.users;")
    process.exit(1)
  }

  await prisma.campaignProfile.upsert({
    where: { userId },
    create: { userId, ...PROFILE },
    update: PROFILE,
  })
  console.log(`Campaign profile saved for ${PROFILE.candidateName}`)

  for (const keyword of KEYWORDS) {
    await prisma.newsKeyword.upsert({
      where: { userId_keywordId: { userId, keywordId: keyword.keywordId } },
      create: { userId, ...keyword, active: true },
      update: keyword,
    })
  }
  console.log(`${KEYWORDS.length} keyword(s) saved`)

  // Positions have no natural key, so an existing one is matched on its issue.
  for (const [index, position] of POSITIONS.entries()) {
    const existing = await prisma.candidatePosition.findFirst({
      where: { userId, issue: position.issue },
    })

    if (existing) {
      await prisma.candidatePosition.update({
        where: { id: existing.id },
        data: { ...position, sortOrder: index },
      })
    } else {
      await prisma.candidatePosition.create({
        data: { userId, ...position, sortOrder: index, active: true },
      })
    }
  }
  console.log(`${POSITIONS.length} position(s) saved`)

  console.log("\nNext: npm run news:preview -- " + userId)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
