"use strict"

const { prisma } = require("../lib/prisma")

// Latest snapshot per platform post.
async function loadLatestMetrics() {
  const posts = await prisma.platformPost.findMany({
    where: { status: "SUCCESS" },
    include: {
      metrics: { orderBy: { fetchedAt: "desc" }, take: 1 },
      script: {
        select: {
          id: true,
          title: true,
          topic: { select: { id: true, issue: true } },
        },
      },
    },
  })

  return posts.map((post) => {
    const latest = post.metrics[0]
    const views = latest?.views ?? 0
    const likes = latest?.likes ?? 0
    const comments = latest?.comments ?? 0
    const shares = latest?.shares ?? 0

    return {
      post,
      views,
      likes,
      comments,
      shares,
      engagement: likes + comments + shares,
      fetchedAt: latest?.fetchedAt ?? null,
    }
  })
}

async function getSummary(req, res) {
  const rows = await loadLatestMetrics()

  const totalViews = rows.reduce((sum, row) => sum + row.views, 0)
  const totalEngagement = rows.reduce((sum, row) => sum + row.engagement, 0)

  // --- Top topics ---
  const byTopic = new Map()
  for (const row of rows) {
    const topic = row.post.script?.topic
    if (!topic) continue

    const entry = byTopic.get(topic.id) ?? {
      topicId: topic.id,
      issue: topic.issue,
      views: 0,
      engagement: 0,
    }
    entry.views += row.views
    entry.engagement += row.engagement
    byTopic.set(topic.id, entry)
  }
  const topTopics = [...byTopic.values()]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 8)

  // --- Per-platform totals ----
  const byPlatform = new Map()
  for (const row of rows) {
    const entry = byPlatform.get(row.post.platform) ?? {
      platform: row.post.platform,
      views: 0,
      engagement: 0,
      posts: 0,
    }
    entry.views += row.views
    entry.engagement += row.engagement
    entry.posts += 1
    byPlatform.set(row.post.platform, entry)
  }

  // --- Engagement over time (by publish date) ---
  const byDate = new Map()
  for (const row of rows) {
    const publishedAt = row.post.publishedAt
    if (!publishedAt) continue

    const date = publishedAt.toISOString().slice(0, 10)
    const entry = byDate.get(date) ?? {
      date,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    }
    entry.views += row.views
    entry.likes += row.likes
    entry.comments += row.comments
    entry.shares += row.shares
    byDate.set(date, entry)
  }

  res.json({
    summary: {
      totalViews,
      totalEngagement,
      averageEngagement: rows.length
        ? Math.round(totalEngagement / rows.length)
        : 0,
      totalPosts: rows.length,
      topTopic: topTopics[0]?.issue ?? null,
    },
    engagementOverTime: [...byDate.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    topTopics,
    platformPerformance: [...byPlatform.values()],
  })
}

async function listInsights(req, res) {
  const insights = await prisma.insight.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  res.json(insights)
}

module.exports = { getSummary, listInsights }
