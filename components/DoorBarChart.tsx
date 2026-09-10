'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DoorLog } from '@/types'
import { formatDateShort } from '@/lib/utils'
import LoadingSkeleton from './LoadingSkeleton'

interface DoorBarChartProps {
  data: DoorLog[]
  loading?: boolean
  height?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-orange-400 font-semibold text-sm">
        {payload[0].value} kali dibuka
      </p>
    </div>
  )
}

export default function DoorBarChart({ data, loading = false, height = 300 }: DoorBarChartProps) {
  if (loading) {
    return <LoadingSkeleton rows={6} />
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-500 text-sm"
        style={{ height }}
      >
        Tidak ada data pintu untuk rentang waktu ini.
      </div>
    )
  }

  // Group by date, count opens per day
  const grouped: Record<string, number> = {}
  data.forEach((log) => {
    const dateKey = formatDateShort(log.opened_at)
    grouped[dateKey] = (grouped[dateKey] ?? 0) + 1
  })

  const chartData = Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#475569' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#475569' }}
          tickLine={false}
          label={{ value: 'Jumlah Buka', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, dy: 40 }}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#fb923c" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
