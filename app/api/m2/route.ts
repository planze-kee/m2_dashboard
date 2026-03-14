import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchM2FromEcos, monthsAgo, currentYearMonth, type M2DataPoint } from '@/lib/ecos'

// Turso 캐시에서 M2 데이터 조회
async function getCachedM2(): Promise<M2DataPoint[]> {
  const result = await db.execute(
    'SELECT period, value FROM m2_cache ORDER BY period ASC'
  )
  return result.rows.map((row) => ({
    period: row.period as string,
    label: `${(row.period as string).slice(0, 4)}-${(row.period as string).slice(4, 6)}`,
    value: row.value as number,
  }))
}

// Turso 캐시에 M2 데이터 저장
async function cacheM2Data(data: M2DataPoint[]) {
  for (const point of data) {
    await db.execute({
      sql: `INSERT INTO m2_cache (period, value, fetched_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(period) DO UPDATE SET value = excluded.value, fetched_at = excluded.fetched_at`,
      args: [point.period, point.value],
    })
  }
}

export async function GET() {
  // 인증 확인
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }
  try {
    // 1. ECOS API에서 최신 데이터 가져오기 (3년치)
    const startYm = monthsAgo(36)
    const endYm = currentYearMonth()

    let data: M2DataPoint[] = []
    let source = 'ecos'

    try {
      data = await fetchM2FromEcos(startYm, endYm)
      // Turso 캐시에 저장
      if (data.length > 0) {
        await cacheM2Data(data)
      }
    } catch (ecosError) {
      console.warn('ECOS API 조회 실패, 캐시 사용:', ecosError)
      data = await getCachedM2()
      source = 'cache'
    }

    if (data.length === 0) {
      return NextResponse.json({ error: '데이터를 가져올 수 없습니다.' }, { status: 503 })
    }

    // 통계 계산
    const latest = data[data.length - 1]
    const prev = data[data.length - 2]
    const yearAgo = data.find((d) => d.period === `${parseInt(latest.period.slice(0, 4)) - 1}${latest.period.slice(4)}`)

    const momChange = prev ? ((latest.value - prev.value) / prev.value) * 100 : null
    const yoyChange = yearAgo ? ((latest.value - yearAgo.value) / yearAgo.value) * 100 : null

    return NextResponse.json({
      data,
      stats: {
        latest: {
          period: latest.label,
          value: latest.value,
          unit: '십억원',
        },
        momChange,
        yoyChange,
      },
      source,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('M2 데이터 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
