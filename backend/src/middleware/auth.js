"use strict"

const { createClient } = require("@supabase/supabase-js")

const { requireEnv } = require("../lib/env")
const { unauthorized } = require("../utils/errors")

// Verified identities are cached briefly: the dashboard polls render status
// every couple of seconds, and each poll would otherwise be a round-trip to
// Supabase's /auth/v1/user endpoint.
const CACHE_TTL_MS = 60_000
const cache = new Map()

let client = null

function getClient() {
  if (!client) {
    const [url, key] = requireEnv("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}

function bearerToken(req) {
  const header = req.get("authorization") ?? ""
  const [scheme, token] = header.split(" ")
  return scheme?.toLowerCase() === "bearer" && token ? token : null
}

function prune() {
  const now = Date.now()
  for (const [token, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(token)
  }
}

async function verify(token) {
  const cached = cache.get(token)
  if (cached && cached.expiresAt > Date.now()) return cached.user

  const { data, error } = await getClient().auth.getUser(token)
  if (error || !data?.user) return null

  const user = { id: data.user.id, email: data.user.email ?? null }

  if (cache.size > 500) prune()
  cache.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS })

  return user
}

/**
 * Attaches `req.user` when the request carries a valid Supabase access token,
 * and leaves it undefined otherwise. Used by routes that work without a
 * session but behave differently with one.
 */
async function attachUser(req, res, next) {
  try {
    const token = bearerToken(req)
    if (token) req.user = (await verify(token)) ?? undefined
    next()
  } catch (error) {
    next(error)
  }
}

/** Rejects the request with 401 unless it carries a valid access token. */
async function requireUser(req, res, next) {
  try {
    const token = bearerToken(req)
    const user = token ? await verify(token) : null

    if (!user) {
      return next(unauthorized("Sign in to continue."))
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { attachUser, requireUser }
