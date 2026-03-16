import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@libsql/client'

function getDb() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })
}

export async function GET() {
  try {
    const db = getDb()
    const result = await db.execute(
      'SELECT id, user_name, user_image, content, created_at FROM comments ORDER BY created_at DESC LIMIT 100'
    )
    return NextResponse.json({ comments: result.rows })
  } catch (err) {
    return NextResponse.json({ error: '댓글을 불러오지 못했습니다.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { content } = await req.json()
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }
  if (content.length > 300) {
    return NextResponse.json({ error: '300자 이내로 입력해주세요.' }, { status: 400 })
  }

  try {
    const db = getDb()
    await db.execute({
      sql: 'INSERT INTO comments (user_email, user_name, user_image, content) VALUES (?, ?, ?, ?)',
      args: [
        session.user.email,
        session.user.name ?? session.user.email,
        session.user.image ?? null,
        content.trim(),
      ],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: '댓글 저장에 실패했습니다.' }, { status: 500 })
  }
}
