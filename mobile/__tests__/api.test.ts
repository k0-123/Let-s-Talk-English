import { ApiError, loginRequest, request } from '@/lib/api'
import { API_URL } from '@/lib/config'

const respond = (status: number, body: unknown) =>
  jest.fn().mockResolvedValue({ ok: status < 400, status, text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)) })

describe('API client', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('sends the token as a JWT header and builds the query string', async () => {
    const fetchMock = respond(200, { ok: true })
    globalThis.fetch = fetchMock
    await request('/api/app/history', { token: 'abc', query: { page: 2, category: 'part-1', student: undefined, empty: '' } })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${API_URL}/api/app/history?page=2&category=part-1`)
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('JWT abc')
    expect(init.body).toBeUndefined()
  })

  it('sends JSON bodies and lower-cases emails on login', async () => {
    const fetchMock = respond(200, { token: 't', exp: 1, user: { id: '1', role: 'student' } })
    globalThis.fetch = fetchMock
    await loginRequest('  Student@Example.com ', 'secret')
    const [, init] = fetchMock.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ email: 'student@example.com', password: 'secret' })
  })

  it("reads the app API's error message", async () => {
    globalThis.fetch = respond(403, { error: 'This is not available for your account.' })
    await expect(request('/api/app/me')).rejects.toEqual(new ApiError(403, 'This is not available for your account.'))
  })

  it("reads Payload's field errors", async () => {
    globalThis.fetch = respond(400, { errors: [{ message: 'The following field is invalid: email', data: { errors: [{ message: 'A user with the given email is already registered.' }] } }] })
    await expect(request('/api/users', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      message: 'A user with the given email is already registered.',
    })
  })

  it('explains a network failure', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'))
    await expect(request('/api/app/me')).rejects.toMatchObject({ status: 0, message: 'Cannot reach the server. Check your internet connection.' })
  })

  it('gives a friendly message for server errors without a body', async () => {
    globalThis.fetch = respond(502, undefined)
    await expect(request('/api/app/me')).rejects.toMatchObject({ status: 502, message: 'The server had a problem. Please try again.' })
  })
})
