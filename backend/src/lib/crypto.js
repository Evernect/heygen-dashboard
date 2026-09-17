"use strict"

const crypto = require("crypto")

const { env } = require("./env")
const { HttpError } = require("../utils/errors")

const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12
const VERSION = "v1"

let cachedKey = null

/**
 * The 32-byte master key, accepted as 64 hex characters or as base64. Read
 * lazily so a deployment that never stores a credential does not need one.
 */
function masterKey() {
  if (cachedKey) return cachedKey

  const raw = env.CREDENTIAL_ENCRYPTION_KEY
  if (!raw) {
    throw new HttpError(
      503,
      'CREDENTIAL_ENCRYPTION_KEY is not set, so API keys cannot be stored. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64")

  if (key.length !== 32) {
    throw new HttpError(
      503,
      "CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes (64 hex characters, or base64)."
    )
  }

  cachedKey = key
  return cachedKey
}

/** Returns `v1:<iv>:<authTag>:<ciphertext>`, all base64. */
function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey(), iv)

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  return [
    VERSION,
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ciphertext.toString("base64"),
  ].join(":")
}

function decryptSecret(payload) {
  const [version, iv, authTag, ciphertext] = String(payload).split(":")

  if (version !== VERSION || !iv || !authTag || !ciphertext) {
    throw new HttpError(500, "Stored credential is not in a readable format.")
  }

  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      masterKey(),
      Buffer.from(iv, "base64")
    )
    decipher.setAuthTag(Buffer.from(authTag, "base64"))

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64")),
      decipher.final(),
    ]).toString("utf8")
  } catch (error) {
    if (error instanceof HttpError) throw error
    // Wrong key, or the row was tampered with. Either way it is unusable.
    throw new HttpError(
      500,
      "Stored credential could not be decrypted. It was likely encrypted with a different CREDENTIAL_ENCRYPTION_KEY — reconnect the account."
    )
  }
}

/** A safe-to-display hint, e.g. `NWQ4…a1f2`. Never the whole secret. */
function maskSecret(secret) {
  const value = String(secret)
  if (value.length <= 8) return "••••"
  return `${value.slice(0, 3)}…${value.slice(-4)}`
}

module.exports = { encryptSecret, decryptSecret, maskSecret }
