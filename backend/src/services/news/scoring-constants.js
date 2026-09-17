"use strict"

/**
 * Algorithm tuning for the news pipeline.
 *
 * These are deliberately not user settings. They are the knobs that decide what
 * "the same story" and "important" mean, and changing one changes the shape of
 * every run — that is a code change with a test behind it, not a form field.
 */

/** Two headlines are the same story at or above this Jaccard overlap. */
const SIMILARITY = 0.38

/** A cluster matching something from the last week this closely is a repeat. */
const REPEAT_MATCH = 0.6

/** How far back the repeat check looks. */
const HISTORY_DAYS = 7

/** How long scored clusters are kept before being pruned. */
const RETENTION_DAYS = 30

/** At most this many clusters carrying any one topic label. */
const PER_LABEL_CAP = 2

/** How many clusters are handed to the selector. */
const POOL_SIZE = 20

/** Below this many fresh clusters, repeats are allowed back in. */
const MIN_POOL = 5

const REPEAT_PENALTY = -30

/** Articles older than this are dropped before anything else happens. */
const FRESHNESS_HOURS = 36

const WEIGHTS = {
  /** Per distinct outlet, capped at 10. Corroboration. */
  breadth: 7,
  /** Per distinct keyword that found it, capped at 5. */
  overlap: 5,
  /** Multiplier on the keyword's own priority. */
  priority: 2,
  /** Flat bonus for a story in the candidate's district. */
  geo: 8,
  /** Flat bonus for a story naming the candidate, an opponent or the governor. */
  named: 10,
  /** Penalty for a story only one outlet ran. */
  solo: -8,
}

/** Hours old → points. The first bucket a cluster fits wins. */
const RECENCY_BUCKETS = [
  { maxHours: 6, points: 8 },
  { maxHours: 12, points: 6 },
  { maxHours: 24, points: 4 },
]
const RECENCY_FALLBACK = 1

const SCORE_MIN = 0
const SCORE_MAX = 100

/** Tokens too common to say anything about whether two headlines match. */
const STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "to", "for", "on", "and", "is", "as", "at",
  "by", "with", "from", "after", "over", "new", "says", "said", "will",
  "amid", "its", "his", "her", "their", "this", "that", "has", "have",
])

/** Tokens shorter than this carry no signal either. */
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
