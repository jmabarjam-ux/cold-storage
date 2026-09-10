'use client'

import { useCallback, useEffect, useState } from 'react'
import Header from '@/components/Header'
import DateRangePicker from '@/components/DateRangePicker'
import DoorBarChart from '@/components/DoorBarChart'
import DoorTable from '@/components/DoorTable'
import StatCard from '@/components/StatCard'
import ExportCSVButton from '@/components/ExportCSVButton'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import ErrorMessage from '@/components/ErrorMessage'
import { DoorLog, DateRange } from '@/types'
import { calcAverage, daysAgo, formatDateForFilename, formatDuration } from '@/lib/utils'

export default function PintuPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: daysAgo(7),
    to: new Date(),
  })
  const [data, setData] = useState<DoorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/door?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&limit=200`
      )
      if (!res.ok) throw new Error(`Gagal mengambil data: ${res.statusText}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json.data ?? [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Compute stats
  const totalBuka = data.length
  const durations = data
    .map((d) => d.duration_seconds)
    .filter((s): s is number => s !== null)
  const avgDuration = durations.length > 0 ? Math.round(calcAverage(durations)) : null
  const maxDuration = durations.length > 0 ? Math.max(...durations) : null

  const exportFilename = `pintu_export_${formatDateForFilename(new Date())}.csv`
  const exportHeaders = ['id', 'opened_at', 'closed_at', 'duration_seconds', 'temperature_at_open']

  return (
    <main className="flex-1">
      <Header title="Monitoring Pintu" />

      <div className="p-6 space-y-6">
        {/* Controls row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Error */}
        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Pembukaan"
              value={totalBuka}
              subtitle="Dalam rentang waktu terpilih"
              icon="🚪"
              color="orange"
            />
            <StatCard
              title="Rata-rata Durasi"
              value={formatDuration(avgDuration)}
              subtitle="Rata-rata per pembukaan"
              icon="⏱️"
              color={avgDuration !== null && avgDuration > 300 ? 'yellow' : 'green'}
            />
            <StatCard
              title="Durasi Terlama"
              value={formatDuration(maxDuration)}
              subtitle="Pembukaan terpanjang"
              icon="🔴"
              color={maxDuration !== null && maxDuration > 300 ? 'red' : 'green'}
            />
          </div>
        )}

        {/* Bar Chart */}
        <section className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-slate-200 font-semibold text-base mb-4">
            Frekuensi Pembukaan per Hari
          </h2>
          <DoorBarChart data={data} loading={loading} height={300} />
        </section>

        {/* Export + Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-200 font-semibold text-base">Tabel Data Pintu</h2>
            <ExportCSVButton
              data={data}
              filename={exportFilename}
              headers={exportHeaders}
            />
          </div>
          {loading ? (
            <LoadingSkeleton rows={20} cols={5} />
          ) : (
            <DoorTable data={data} showPagination />
          )}
        </section>
      </div>
    </main>
  )
}
