export interface M2DataPoint {
  period: string   // "202101" 형식
  label: string    // "2021-01" 형식 (차트 표시용)
  value: number    // 십억원
}

interface EcosItemRow {
  ITEM_CODE: string
  ITEM_NAME: string
  P_ITEM_CODE: string | null
  CYCLE: string
  START_TIME: string
  END_TIME: string
}

interface EcosItemListResponse {
  StatisticItemList?: { list_total_count: number; row: EcosItemRow[] }
  RESULT?: { CODE: string; MESSAGE: string }
}

interface EcosSearchRow {
  TIME: string
  DATA_VALUE: string
  ITEM_CODE1: string
  ITEM_NAME1: string
}

interface EcosSearchResponse {
  StatisticSearch?: { list_total_count: number; row: EcosSearchRow[] }
  RESULT?: { CODE: string; MESSAGE: string }
}

interface M2Meta { itemCode: string; endTime: string; cycle: string }
let cachedMeta: M2Meta | null = null

/**
 * 161Y011 통계표의 최상위(합계) 항목코드 + 최신 데이터 기간을 조회
 */
async function getM2Meta(apiKey: string): Promise<M2Meta> {
  if (cachedMeta) return cachedMeta

  const url = `https://ecos.bok.or.kr/api/StatisticItemList/${apiKey}/json/kr/1/200/161Y011`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`StatisticItemList HTTP 오류: ${res.status}`)

  const data: EcosItemListResponse = await res.json()
  if (data.RESULT) throw new Error(`StatisticItemList 오류: ${data.RESULT.CODE} - ${data.RESULT.MESSAGE}`)

  const rows = data.StatisticItemList?.row ?? []

  // 월별(CYCLE=M) + 최상위(P_ITEM_CODE 없음) 항목 탐색
  const monthlyRows = rows.filter(r => r.CYCLE === 'M')
  const top =
    monthlyRows.find(r => !r.P_ITEM_CODE && (r.ITEM_NAME.includes('M2') || r.ITEM_NAME.includes('합계'))) ??
    monthlyRows.find(r => !r.P_ITEM_CODE) ??
    monthlyRows[0]

  if (!top) throw new Error('사용 가능한 항목코드를 찾을 수 없습니다.')

  console.log(`[ECOS] 항목코드: ${top.ITEM_CODE} / ${top.ITEM_NAME} / 주기: ${top.CYCLE} / 최신기간: ${top.END_TIME}`)
  cachedMeta = { itemCode: top.ITEM_CODE, endTime: top.END_TIME, cycle: top.CYCLE }
  return cachedMeta
}

/**
 * 한국은행 ECOS API에서 M2(광의통화) 월별 잔액 데이터를 가져옵니다.
 * 통계표코드: 161Y011 (2025.12 개편 후) - M2 경제주체별 보유현황 (말잔, 계절조정계열)
 */
export async function fetchM2FromEcos(startYm: string, endYm: string): Promise<M2DataPoint[]> {
  const apiKey = process.env.ECOS_API_KEY
  if (!apiKey) throw new Error('ECOS_API_KEY가 설정되지 않았습니다.')

  const meta = await getM2Meta(apiKey)

  // ECOS 최신 데이터 기간을 초과하지 않도록 endYm 조정
  const actualEnd = meta.endTime < endYm ? meta.endTime : endYm

  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${apiKey}/json/kr/1/500/161Y011/${meta.cycle}/${startYm}/${actualEnd}/${meta.itemCode}`
  console.log('[ECOS] 조회 URL:', url)

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`ECOS API HTTP 오류: ${res.status}`)

  const data: EcosSearchResponse = await res.json()
  if (data.RESULT) throw new Error(`ECOS API 오류: ${data.RESULT.CODE} - ${data.RESULT.MESSAGE}`)

  const rows = data.StatisticSearch?.row ?? []

  return rows
    .map((row) => ({
      period: row.TIME,
      label: `${row.TIME.slice(0, 4)}-${row.TIME.slice(4, 6)}`,
      value: parseFloat(row.DATA_VALUE) || 0,
    }))
    .filter((d) => d.value > 0)
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
