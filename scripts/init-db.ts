import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local 파일을 직접 파싱
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  const value = trimmed.slice(idx + 1).trim()
  process.env[key] = value
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

async function initDb() {
  console.log('DB 초기화 시작...')

  await db.execute(`
    CREATE TABLE IF NOT EXISTS allowed_users (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT    UNIQUE NOT NULL,
      name  TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('✓ allowed_users 테이블 생성')

  await db.execute(`
    CREATE TABLE IF NOT EXISTS m2_cache (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      period     TEXT    UNIQUE NOT NULL,
      value      REAL    NOT NULL,
      unit       TEXT    DEFAULT '십억원',
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('✓ m2_cache 테이블 생성')

  const seedUsers = [
    { email: 'kts123@kookmin.ac.kr', name: '교수님' },
    { email: 'ummoti94@gmail.com', name: '학생' },
  ]

  for (const user of seedUsers) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO allowed_users (email, name) VALUES (?, ?)',
      args: [user.email, user.name],
    })
    console.log(`✓ 허용 사용자 등록: ${user.email}`)
  }

  console.log('\nDB 초기화 완료!')
  process.exit(0)
}

initDb().catch((err) => {
  console.error('DB 초기화 오류:', err)
  process.exit(1)
})
