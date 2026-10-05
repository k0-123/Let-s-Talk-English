import { API_URL } from './config'

/** An error the server explained, safe to show to the user. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Options = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; token?: string | null; query?: Record<string, string | number | null | undefined> }

const buildUrl = (path: string, query?: Options['query']) => {
  const url = `${API_URL}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

/** Reads a message from either the app API ({ error }) or Payload's REST API ({ errors: [{ message }] }). */
const errorMessage = (body: unknown, status: number): string => {
  if (body && typeof body === 'object') {
    const b = body as { error?: unknown; errors?: { message?: unknown; data?: { errors?: { message?: string }[] } }[]; message?: unknown }
    if (typeof b.error === 'string') return b.error
    const first = b.errors?.[0]
    const fieldMessage = first?.data?.errors?.[0]?.message
    if (typeof fieldMessage === 'string') return fieldMessage
    if (typeof first?.message === 'string') return first.message
    if (typeof b.message === 'string') return b.message
  }
  if (status === 0) return 'Cannot reach the server. Check your internet connection.'
  if (status >= 500) return 'The server had a problem. Please try again.'
  return 'Something went wrong. Please try again.'
}

export const request = async <T>(path: string, options: Options = {}): Promise<T> => {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `JWT ${options.token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, errorMessage(null, 0))
  }

  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!response.ok) throw new ApiError(response.status, errorMessage(body, response.status))
  return body as T
}

// ---------------------------------------------------------------- accounts (Payload REST)

export type LoginResult = { token: string; exp: number; user: { id: string; role: string } }

export const loginRequest = (email: string, password: string) =>
  request<LoginResult>('/api/users/login', { method: 'POST', body: { email: email.trim().toLowerCase(), password } })

export const registerRequest = (data: { name: string; email: string; password: string; role: 'student' | 'educator' }) =>
  request<unknown>('/api/users', { method: 'POST', body: { ...data, email: data.email.trim().toLowerCase() } })

export const forgotPasswordRequest = (email: string) =>
  request<unknown>('/api/users/forgot-password', { method: 'POST', body: { email: email.trim().toLowerCase() } })

export const refreshTokenRequest = (token: string) =>
  request<{ refreshedToken: string; exp: number }>('/api/users/refresh-token', { method: 'POST', token })

export const logoutRequest = (token: string) => request<unknown>('/api/users/logout', { method: 'POST', token }).catch(() => undefined)
