import { isSupabaseConfigured } from "@/lib/supabase/config"

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export class ApiConfigError extends Error {
  constructor() {
    super(
      "NEXT_PUBLIC_API_BASE_URL is not set. Add it to your .env.local and restart the dev server."
    )
    this.name = "ApiConfigError"
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Couldn't reach the server. Check your connection and try again.")
    this.name = "NetworkError"
  }
}

const RETRY_DELAYS_MS = [700, 2000]
const RETRYABLE_STATUSES = new Set([502, 503, 504])

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  accessToken?: string | null
}

async function browserAccessToken() {
  if (typeof window === "undefined" || !isSupabaseConfigured) return null

  const { createClient } = await import("@/lib/supabase/client")
  const { data } = await createClient().auth.getSession()

  return data.session?.access_token ?? null
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  if (!BASE_URL) throw new ApiConfigError()

  const url = new URL(
    path.replace(/^\//, ""),
    BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`
  )

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

export async function apiRequest<T>(
  path: string,
  { body, query, headers, accessToken, ...init }: RequestOptions = {}
): Promise<T> {
  const token = accessToken ?? (await browserAccessToken())
  const url = buildUrl(path, query)
  const requestInit: RequestInit = {
    ...init,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  }

  const retries = (init.method ?? "GET") === "GET" ? RETRY_DELAYS_MS : []
  let response: Response | null = null

  for (let attempt = 0; ; attempt++) {
    const canRetry = attempt < retries.length

    try {
      response = await fetch(url, requestInit)
    } catch (caught) {
      if (init.signal?.aborted) throw caught
      if (!canRetry) throw new NetworkError()
      response = null
    }

    if (!canRetry || (response && !RETRYABLE_STATUSES.has(response.status))) {
      break
    }

    await wait(retries[attempt])
  }

  if (!response) throw new NetworkError()

  const text = await response.text()
  const payload = text ? safeParse(text) : null

  if (!response.ok) {
    const message =
      (isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : null) ?? `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  return payload as T
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
}

export const isApiConfigured = Boolean(BASE_URL)
