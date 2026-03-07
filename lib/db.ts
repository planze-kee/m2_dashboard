import { createClient } from '@libsql/client'

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL 환경변수가 설정되지 않았습니다.')
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN 환경변수가 설정되지 않았습니다.')
}

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export async function isEmailAllowed(email: string): Promise<boolean> {
  const result = await db.execute({
    sql: 'SELECT id FROM allowed_users WHERE email = ?',
    args: [email.toLowerCase()],
  })
  return result.rows.length > 0
}
