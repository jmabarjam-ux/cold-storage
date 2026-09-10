'use client'

import { useCallback, useEffect, useState } from 'react'
import Header from '@/components/Header'
import DateRangePicker from '@/components/DateRangePicker'
import TemperatureChart from '@/components/TemperatureChart'
import TemperatureTable from '@/components/TemperatureTable'
import ExportCSVButton from '@/components/ExportCSVButton'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import ErrorMessage from '@/components/ErrorMessage'
import { TemperatureLog, DateRange } from '@/types'
import { calcAverage, daysAgo, formatDateForFilename } from '@/lib/utils'

export default function SuhuPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: daysAgo(7),
    to: new Date(),
  })
  const [data, setData] = useState<TemperatureLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/temperature?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&limit=500`
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

  const temperatures = data.map((d) => d.temperature)
  const minTemp = temperatures.length > 0 ? Math.min(...temperatures) : null
  const maxTemp = temperatures.length > 0 ? Math.max(...temperatures) : null
  const avgTemp = temperatures.length > 0 ? calcAverage(temperatures) : null

  const exportFilename = `suhu_export_${formatDateForFilename(new Date())}.csv`
  const exportHeaders = ['id', 'recorded_at', 'temperature', 'unit']

  return (
    <main className="flex-1">
      <Header title="Monitoring Suhu" />

      <div className="p-6 space-y-6">
        {/* Controls row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Error */}
        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {/* Chart */}
        <section className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-slate-200 font-semibold text-base mb-4">
            Grafik Suhu
          </h2>
          <TemperatureChart
            data={data}
            showReferenceLine
            loading={loading}
            height={400}
          />

          {/* Min / Max / Avg annotation */}
          {!loading && data.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-slate-700">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-xs">Minimum</span>
                <span className="text-sky-400 font-semibold tabular-nums">
                  {minTemp !== null ? `${minTemp}°C` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-xs">Maksimum</span>
                <span className="text-sky-400 font-semibold tabular-nums">
                  {maxTemp !== null ? `${maxTemp}°C` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-xs">Rata-rata</span>
                <span className="text-sky-400 font-semibold tabular-nums">
                  {avgTemp !== null ? `${avgTemp}°C` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-xs">Total Data</span>
                <span className="text-slate-300 font-semibold tabular-nums">
                  {data.length} titik
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Export + Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-200 font-semibold text-base">Tabel Data Suhu</h2>
            <ExportCSVButton
              data={data}
              filename={exportFilename}
              headers={exportHeaders}
            />
          </div>
          {loading ? (
            <LoadingSkeleton rows={20} cols={3} />
          ) : (
            <TemperatureTable data={data} showPagination />
          )}
        </section>
      </div>
    </main>
  )
}
