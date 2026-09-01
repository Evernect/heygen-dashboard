// Thin fetch wrapper around the Express API.
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

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
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
  { body, query, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

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
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
}

export const isApiConfigured = Boolean(BASE_URL)
