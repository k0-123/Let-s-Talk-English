export const getServerURL = (): string =>
  (process.env.SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
