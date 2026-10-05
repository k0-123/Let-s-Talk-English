import Link from 'next/link'

export const AdminNavLinks = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
    <Link href="/import" className="nav__link">
      Bulk import question sets
    </Link>
    <Link href="/" className="nav__link">
      Open the app
    </Link>
  </div>
)
