'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TemperatureLog } from '@/types'
import { formatDatetime, formatTime } from '@/lib/utils'
import LoadingSkeleton from './LoadingSkeleton'

interface TemperatureChartProps {
  data: TemperatureLog[]
  showReferenceLine?: boolean
  loading?: boolean
  height?: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: TemperatureLog }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-slate-400 text-xs mb-1">{formatDatetime(entry.payload.recorded_at)}</p>
      <p className="text-sky-400 font-semibold text-sm">
        {entry.value}°C
      </p>
    </div>
  )
}

export default function TemperatureChart({
  data,
  showReferenceLine = false,
  loading = false,
  height = 300,
}: TemperatureChartProps) {
  if (loading) {
    return <LoadingSkeleton rows={6} />
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-slate-500 text-sm"
        style={{ height }}
      >
        Tidak ada data suhu untuk rentang waktu ini.
      </div>
    )
  }

  const temperatures = data.map((d) => d.temperature)
  const minTemp = Math.min(...temperatures)
  const maxTemp = Math.max(...temperatures)
  const domainMin = Math.floor(minTemp - 5)
  const domainMax = Math.ceil(maxTemp + 5)

  const chartData = data.map((d) => ({
    ...d,
    time: formatTime(d.recorded_at),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#475569' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[domainMin, domainMax]}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#475569' }}
          tickLine={false}
          tickFormatter={(v) => `${v}°C`}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        {showReferenceLine && (
          <ReferenceLine
            y={-18}
            stroke="#ef4444"
            strokeDasharray="6 3"
            label={{
              value: '-18°C target',
              fill: '#ef4444',
              fontSize: 11,
              position: 'insideTopRight',
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="temperature"
          stroke="#38bdf8"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
