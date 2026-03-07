export interface M2DataPoint {
  period: string   // "202101" 형식
  label: string    // "2021-01" 형식 (차트 표시용)
  value: number    // 십억원
}

interface EcosRow {
  TIME: string
  DATA_VALUE: string
  ITEM_NAME1: string
  UNIT_NAME: string
}

interface EcosResponse {
  StatisticSearch?: {
    list_total_count: number
    row: EcosRow[]
  }
  RESULT?: {
    CODE: string
    MESSAGE: string
  }
}

/**
 * 한국은행 ECOS API에서 M2(광의통화) 월별 잔액 데이터를 가져옵니다.
 * 통계표코드: 101Y004, 항목코드: BBHA00 (M2 광의통화 잔액)
 */
export async function fetchM2FromEcos(startYm: string, endYm: string): Promise<M2DataPoint[]> {
  const apiKey = process.env.ECOS_API_KEY
  if (!apiKey) throw new Error('ECOS_API_KEY가 설정되지 않았습니다.')

  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/200/101Y004/MM/${startYm}/${endYm}/BBHA00`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`ECOS API 오류: ${res.status}`)

  const data: EcosResponse = await res.json()

  if (data.RESULT) {
    throw new Error(`ECOS API 오류: ${data.RESULT.CODE} - ${data.RESULT.MESSAGE}`)
  }

  const rows = data.StatisticSearch?.row ?? []

  return rows
    .map((row) => ({
      period: row.TIME,
      label: `${row.TIME.slice(0, 4)}-${row.TIME.slice(4, 6)}`,
      value: parseFloat(row.DATA_VALUE) || 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
}

/** YYYYMM 형식으로 N개월 전 날짜 반환 */
export function monthsAgo(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}

/** YYYYMM 형식으로 현재 달 반환 */
export function currentYearMonth(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}${m}`
}
