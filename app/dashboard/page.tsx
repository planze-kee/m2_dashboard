'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import type { M2DataPoint } from '@/lib/ecos'

const M2Chart = dynamic(() => import('@/components/M2Chart'), { ssr: false })

interface M2Stats {
  latest: { period: string; value: number; unit: string }
  momChange: number | null
  yoyChange: number | null
}

interface M2Response {
  data: M2DataPoint[]
  stats: M2Stats
  source: string
  updatedAt: string
  error?: string
}

function StatCard({
  title,
  value,
  sub,
  color = 'blue',
}: {
  title: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'red' | 'slate'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-600',
    slate: 'bg-slate-50 text-slate-700',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-sm text-slate-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [m2Data, setM2Data] = useState<M2Response | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/m2')
      .then((res) => res.json())
      .then((json: M2Response) => {
        if (json.error) throw new Error(json.error)
        setM2Data(json)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-slate-500">M2 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center bg-white rounded-xl p-8 shadow-sm border border-red-100">
            <p className="text-red-500 font-semibold mb-2">데이터 로딩 실패</p>
            <p className="text-slate-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const { stats, data, source, updatedAt } = m2Data!
  const latestValueTril = (stats.latest.value / 1000).toFixed(1)

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 제목 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">M2 광의통화 현황</h2>
          <p className="text-slate-500 text-sm mt-1">
            한국은행 경제통계시스템(ECOS) 제공 데이터 · 출처: {source === 'ecos' ? 'ECOS API' : 'DB 캐시'}
            {' · '}최종 갱신: {new Date(updatedAt).toLocaleString('ko-KR')}
          </p>
        </div>

        {/* 요약 통계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            title={`최신 M2 잔액 (${stats.latest.period})`}
            value={`${latestValueTril} 조원`}
            sub={`${stats.latest.value.toLocaleString('ko-KR')} 십억원`}
            color="blue"
          />
          <StatCard
            title="전월 대비 증감률"
            value={
              stats.momChange !== null
                ? `${stats.momChange >= 0 ? '+' : ''}${stats.momChange.toFixed(2)}%`
                : '-'
            }
            color={
              stats.momChange === null
                ? 'slate'
                : stats.momChange >= 0
                ? 'green'
                : 'red'
            }
          />
          <StatCard
            title="전년 동월 대비 증감률"
            value={
              stats.yoyChange !== null
                ? `${stats.yoyChange >= 0 ? '+' : ''}${stats.yoyChange.toFixed(2)}%`
                : '-'
            }
            color={
              stats.yoyChange === null
                ? 'slate'
                : stats.yoyChange >= 0
                ? 'green'
                : 'red'
            }
          />
        </div>

        {/* 차트 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <h3 className="text-base font-semibold text-slate-700 mb-4">
            M2 광의통화 월별 잔액 추이 (최근 3년)
          </h3>
          <M2Chart data={data} />
        </div>

        {/* 데이터 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-700">월별 상세 데이터</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">기간</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">M2 잔액 (십억원)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">M2 잔액 (조원)</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">전월 대비</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...data].reverse().map((row, i, arr) => {
                  const prev = arr[i + 1]
                  const change = prev ? ((row.value - prev.value) / prev.value) * 100 : null
                  return (
                    <tr key={row.period} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-700">{row.label}</td>
                      <td className="px-6 py-3 text-right text-slate-600">{row.value.toLocaleString('ko-KR')}</td>
                      <td className="px-6 py-3 text-right text-slate-600">{(row.value / 1000).toFixed(1)}</td>
                      <td className={`px-6 py-3 text-right font-medium ${change === null ? 'text-slate-400' : change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {change === null ? '-' : `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-400 text-center">
          출처: 한국은행 경제통계시스템(ECOS) · 통계표코드: 101Y004 · 항목: M2(광의통화) 잔액
        </p>
      </main>
    </div>
  )
}
