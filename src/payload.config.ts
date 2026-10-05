import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { AiFeedback } from './collections/AiFeedback'
import { Assignments } from './collections/Assignments'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { PracticeLogs } from './collections/PracticeLogs'
import { QuestionSets } from './collections/QuestionSets'
import { StudentNotes } from './collections/StudentNotes'
import { Users } from './collections/Users'
import { appEndpoints } from './endpoints/app'
import { SITE_NAME } from './lib/constants'
import { getServerURL } from './lib/server-url'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = getServerURL()
// Extra origins allowed to call the API from a browser, e.g. the mobile app's web preview
// (CORS_ORIGINS=http://localhost:8081). The native app sends no Origin and needs none.
const extraOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean)

// Without SMTP settings Payload prints emails to the server console, which is
// what we want in development and tests.
const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@example.com',
      defaultFromName: process.env.EMAIL_FROM_NAME || SITE_NAME,
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    })
  : undefined

export default buildConfig({
  serverURL,
  cors: [serverURL, ...extraOrigins],
  csrf: [serverURL],
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ` – ${SITE_NAME} admin`,
    },
    components: {
      afterNavLinks: ['@/components/admin/AdminNavLinks#AdminNavLinks'],
      beforeDashboard: ['@/components/admin/Overview#Overview'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [QuestionSets, Categories, Media, Users, PracticeLogs, Assignments, StudentNotes, AiFeedback],
  // The mobile app's API: /api/app/* (src/endpoints/app.ts).
  endpoints: appEndpoints,
  graphQL: {
    disable: true,
  },
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    idType: 'uuid',
    // Development pushes schema changes straight to the database. Set
    // PAYLOAD_DB_PUSH=false to use committed migrations only (end-to-end tests do).
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
    // Production applies committed migrations on boot.
    prodMigrations: migrations,
  }),
  email,
  sharp,
  telemetry: false,
})
