"use strict"

const SIMILARITY = 0.38

const REPEAT_MATCH = 0.6

const HISTORY_DAYS = 7

const RETENTION_DAYS = 30

const PER_LABEL_CAP = 2

const POOL_SIZE = 20

const MIN_POOL = 5

const REPEAT_PENALTY = -30

const FRESHNESS_HOURS = 36

const WEIGHTS = {
  breadth: 7,
  overlap: 5,
  priority: 2,
  geo: 8,
  named: 10,
  solo: -8,
}

const RECENCY_BUCKETS = [
  { maxHours: 6, points: 8 },
  { maxHours: 12, points: 6 },
  { maxHours: 24, points: 4 },
]
const RECENCY_FALLBACK = 1

const SCORE_MIN = 0
const SCORE_MAX = 100

const STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "to", "for", "on", "and", "is", "as", "at",
  "by", "with", "from", "after", "over", "new", "says", "said", "will",
  "amid", "its", "his", "her", "their", "this", "that", "has", "have",
])

const MIN_TOKEN_LENGTH = 3

module.exports = {
  SIMILARITY,
  REPEAT_MATCH,
  HISTORY_DAYS,
  RETENTION_DAYS,
  PER_LABEL_CAP,
  POOL_SIZE,
  MIN_POOL,
  REPEAT_PENALTY,
  FRESHNESS_HOURS,
  WEIGHTS,
  RECENCY_BUCKETS,
  RECENCY_FALLBACK,
  SCORE_MIN,
  SCORE_MAX,
  STOPWORDS,
  MIN_TOKEN_LENGTH,
}
