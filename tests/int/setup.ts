import 'dotenv/config'

// Integration tests always run against a separate, disposable database.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lte_test'
process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret'
// No SMTP in tests: Payload falls back to logging emails.
process.env.SMTP_HOST = ''
