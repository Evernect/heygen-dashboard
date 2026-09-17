"use strict"

/**
 * Stages 1-6 of the daily news pipeline for one user, printed rather than
 * saved. No LLM call, no writes.
 *
 * This is how keyword configuration gets tuned: the counts show how much each
 * feed brought back and how much its terms and places threw away, which is
 * almost always the reason a morning run comes back empty.
 *
 *   npm run news:preview -- <user-id>
 */

const { prisma } = require("../src/lib/prisma")
const { buildFeedRequests } = require("../src/services/news/feed-url.builder")
const { fetchFeeds } = require("../src/services/news/rss-fetch.service")
const { parseFeed } = require("../src/services/news/rss-parse")
const { flattenFeedItems } = require("../src/services/news/article-filter")
const { clusterAndScore } = require("../src/services/news/cluster-scoring")
const { loadRecentHistory } = require("../src/services/news/news-history.service")

async function main() {
  const userId = process.argv[2]

  if (!userId) {
    console.error("Usage: npm run news:preview -- <user-id>")
    console.error("Find one with: select id, email from auth.users;")
    process.exit(1)
  }

  const profile = await prisma.campaignProfile.findUnique({ where: { userId } })
  if (!profile) {
    console.error(`No campaign profile for ${userId}. Set one up first.`)
    process.exit(1)
  }

  const keywords = await prisma.newsKeyword.findMany({
    where: { userId, active: true },
    orderBy: { keywordId: "asc" },
  })

  const requests = buildFeedRequests(keywords)
  console.log(`\n${requests.length} active feed(s) for ${profile.candidateName}\n`)

  if (!requests.length) return

  const responses = await fetchFeeds(requests)
  const articles = []

  console.log("FEEDS")
  for (const response of responses) {
    const code = response.keyword.keywordId

    if (response.error || !response.xml) {
      console.log(`  ${code.padEnd(6)} FAILED  ${response.error ?? "no body"}`)
      continue
    }

    const feed = parseFeed(response.xml)
    if (!feed) {
      console.log(`  ${code.padEnd(6)} FAILED  unparseable`)
      continue
    }

    const { articles: kept, found, stale, offTopic } = flattenFeedItems({
      feed,
      keyword: response.keyword,
      now: Date.now(),
    })

    articles.push(...kept)
    console.log(
      `  ${code.padEnd(6)} ${String(kept.length).padStart(3)} kept   ` +
        `(${found} found, ${stale} stale, ${offTopic} off-topic)  ${response.keyword.topicLabel}`
    )
  }

  if (!articles.length) {
    console.log(
      "\nNothing survived the filters. Usually the terms or places are too narrow.\n"
    )
    return
  }

  const history = await loadRecentHistory(userId)

  const { clusters, stats } = clusterAndScore({
    articles,
    history,
    signals: {
      districtTerms: profile.districtTerms ?? [],
      candidateName: profile.candidateName,
    },
    now: Date.now(),
  })

  console.log(
    `\n${stats.articles} articles → ${stats.unique} unique → ${stats.clustered} clusters ` +
      `(${stats.repeats} seen in the last week) → ${stats.shortlisted} shortlisted\n`
  )

  console.log("SHORTLIST")
  for (const cluster of clusters) {
    const flags = [
      cluster.isDistrict ? "local" : null,
      cluster.isNamed ? "named" : null,
      cluster.isRepeat ? "repeat" : null,
      cluster.outletCount === 1 ? "single outlet" : null,
    ]
      .filter(Boolean)
      .join(", ")

    console.log(
      `\n  [${cluster.clusterId}] score ${cluster.score}  ` +
        `${cluster.outletCount} outlet(s), ${cluster.hoursOld}h old${flags ? `  (${flags})` : ""}`
    )
    console.log(`      ${cluster.clusterTitle}`)
    console.log(`      labels: ${cluster.topicLabels || "—"}`)
    if (cluster.urls[0]) console.log(`      ${cluster.urls[0]}`)
  }

  console.log("")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
