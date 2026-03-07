'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { M2DataPoint } from '@/lib/ecos'

interface TooltipPayload {
  value: number
  name: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-sm text-blue-600">
          M2 잔액:{' '}
          <span className="font-bold">
            {payload[0].value.toLocaleString('ko-KR')} 십억원
          </span>
        </p>
      </div>
    )
  }
  return null
}

export default function M2Chart({ data }: { data: M2DataPoint[] }) {
  const tickInterval = Math.max(1, Math.floor(data.length / 12))

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#64748b' }}
          interval={tickInterval}
          angle={-30}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}조`}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={() => 'M2 광의통화 잔액 (십억원)'}
          wrapperStyle={{ fontSize: '13px' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          name="M2"
          stroke="#2563eb"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#2563eb' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
