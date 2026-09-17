"use strict"

const defaults = require("./scoring-constants")

function tokenize(text, constants = defaults) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length >= constants.MIN_TOKEN_LENGTH &&
        !constants.STOPWORDS.has(word)
    )
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0

  let intersection = 0
  for (const token of a) if (b.has(token)) intersection += 1

  const union = a.size + b.size - intersection
  return union ? intersection / union : 0
}

function dedupeByLink(articles) {
  const seen = new Set()
  const unique = []

  for (const article of articles) {
    const key = article.link || article.title
    if (!key || seen.has(key)) continue
    seen.add(key)
    unique.push(article)
  }

  return unique
}

function clusterByHeadline(articles, constants = defaults) {
  const clusters = []

  for (const article of articles) {
    const tokens = new Set(tokenize(article.title, constants))
    if (!tokens.size) continue

    let best = null
    let bestScore = 0

    for (const cluster of clusters) {
      const score = jaccard(tokens, cluster.tokens)
      if (score > bestScore) {
        bestScore = score
        best = cluster
      }
    }

    if (best && bestScore >= constants.SIMILARITY) {
      best.articles.push(article)
      for (const token of tokens) best.tokens.add(token)
    } else {
      clusters.push({ tokens, articles: [article] })
    }
  }

  return clusters
}

function recencyPoints(hoursOld, constants = defaults) {
  for (const bucket of constants.RECENCY_BUCKETS) {
    if (hoursOld <= bucket.maxHours) return bucket.points
  }
  return constants.RECENCY_FALLBACK
}

function mentionsAny(haystack, needles) {
  const hay = haystack.toLowerCase()
  return (needles ?? []).some((needle) => {
    const term = String(needle ?? "").trim().toLowerCase()
    return term.length > 0 && hay.includes(term)
  })
}

function orderUrls(articles) {
  return articles
    .map((article) => article.link)
    .filter(Boolean)
    .sort(
      (a, b) =>
        (a.includes("news.google.com") ? 1 : 0) -
        (b.includes("news.google.com") ? 1 : 0)
    )
    .slice(0, 5)
}

function scoreCluster({ cluster, history, signals, now, constants = defaults }) {
  const articles = [...cluster.articles].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  )

  const outlets = new Set(
    articles.map((article) => String(article.outlet).toLowerCase())
  )
  const keywordIds = new Set(
    articles.map((article) => article.keywordId).filter(Boolean)
  )

  const newest = Math.max(
    ...articles.map((article) => new Date(article.publishedAt).getTime())
  )
  const hoursOld = (now - newest) / 3600000

  const text = articles
    .map((article) => `${article.title} ${article.description ?? ""}`)
    .join(" ")

  const isDistrict =
    articles.some((article) => article.scope === "district") ||
    mentionsAny(text, signals?.districtTerms)

  const isNamed =
    articles.some((article) => article.type === "name") ||
    mentionsAny(text, [signals?.candidateName, ...(signals?.namedTerms ?? [])])

  const isRepeat = (history ?? []).some(
    (entry) => jaccard(cluster.tokens, entry) >= constants.REPEAT_MATCH
  )

  const weights = constants.WEIGHTS
  const raw =
    Math.min(outlets.size, 10) * weights.breadth +
    Math.min(keywordIds.size, 5) * weights.overlap +
    recencyPoints(hoursOld, constants) +
    Math.max(...articles.map((article) => Number(article.priority) || 1)) *
      weights.priority +
    (isDistrict ? weights.geo : 0) +
    (isNamed ? weights.named : 0) +
    (outlets.size === 1 ? weights.solo : 0) +
    (isRepeat ? constants.REPEAT_PENALTY : 0)

  return {
    isRepeat,
    tokens: [...cluster.tokens],
    clusterTitle: articles[0].title,
    topicLabels: [
      ...new Set(articles.map((a) => a.topicLabel).filter(Boolean)),
    ].join(", "),
    articleCount: articles.length,
    outletCount: outlets.size,
    keywordHits: keywordIds.size,
    hoursOld: Math.round(hoursOld),
    publishedAt: new Date(newest).toISOString(),
    isDistrict,
    isNamed,
    score: Math.max(
      constants.SCORE_MIN,
      Math.min(constants.SCORE_MAX, Math.round(raw))
    ),
    urls: orderUrls(articles),
    headlines: articles
      .slice(0, 5)
      .map((article) => `${article.title} (${article.outlet})`),
    outlet: articles[0].outlet,
  }
}

function capPerLabel(clusters, constants = defaults) {
  const used = {}

  return clusters.filter((cluster) => {
    const labels = (cluster.topicLabels || "unlabelled").split(", ")
    if (labels.every((label) => (used[label] ?? 0) >= constants.PER_LABEL_CAP)) {
      return false
    }

    for (const label of labels) used[label] = (used[label] ?? 0) + 1
    return true
  })
}

function clusterAndScore({
  articles,
  history = [],
  signals = {},
  now = Date.now(),
  constants = defaults,
}) {
  const unique = dedupeByLink(articles ?? [])
  const clusters = clusterByHeadline(unique, constants)

  const historyTokenSets = history.map(
    (entry) => new Set(Array.isArray(entry) ? entry : (entry?.tokens ?? []))
  )

  const scored = clusters.map((cluster) =>
    scoreCluster({
      cluster,
      history: historyTokenSets,
      signals,
      now,
      constants,
    })
  )

  const fresh = scored.filter((cluster) => !cluster.isRepeat)
  const working = fresh.length >= constants.MIN_POOL ? fresh : scored

  const shortlist = capPerLabel(
    [...working].sort((a, b) => b.score - a.score),
    constants
  ).slice(0, constants.POOL_SIZE)

  return {
    clusters: shortlist.map((cluster, index) => ({
      ...cluster,
      clusterId: String(index + 1),
    })),
    stats: {
      articles: (articles ?? []).length,
      unique: unique.length,
      clustered: clusters.length,
      repeats: scored.length - fresh.length,
      shortlisted: shortlist.length,
    },
  }
}

module.exports = {
  tokenize,
  jaccard,
  dedupeByLink,
  clusterByHeadline,
  recencyPoints,
  orderUrls,
  scoreCluster,
  capPerLabel,
  clusterAndScore,
}
