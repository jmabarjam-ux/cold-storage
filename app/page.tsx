'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Header from '@/components/Header'
import StatCard from '@/components/StatCard'
import TemperatureChart from '@/components/TemperatureChart'
import DoorTable from '@/components/DoorTable'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import ErrorMessage from '@/components/ErrorMessage'
import { TemperatureLog, DoorLog, DashboardStats } from '@/types'
import { calcAverage, startOfToday } from '@/lib/utils'

export default function DashboardPage() {
  const [tempData, setTempData] = useState<TemperatureLog[]>([])
  const [doorData, setDoorData] = useState<DoorLog[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    currentTemp: null,
    avgTemp24h: null,
    totalDoorOpenToday: 0,
    longestDoorOpenToday: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)

      const now = new Date()
      const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const todayStart = startOfToday()

      const [tempRes, doorRes] = await Promise.all([
        fetch(
          `/api/temperature?from=${ago24h.toISOString()}&to=${now.toISOString()}&limit=500`
        ),
        fetch(
          `/api/door?from=${todayStart.toISOString()}&to=${now.toISOString()}&limit=200`
        ),
      ])

      if (!tempRes.ok) throw new Error(`Gagal mengambil data suhu: ${tempRes.statusText}`)
      if (!doorRes.ok) throw new Error(`Gagal mengambil data pintu: ${doorRes.statusText}`)

      const tempJson = await tempRes.json()
      const doorJson = await doorRes.json()

      if (tempJson.error) throw new Error(tempJson.error)
      if (doorJson.error) throw new Error(doorJson.error)

      const temps: TemperatureLog[] = tempJson.data ?? []
      const doors: DoorLog[] = doorJson.data ?? []

      setTempData(temps)
      setDoorData(doors)

      // Compute stats client-side
      const currentTemp = temps.length > 0 ? temps[temps.length - 1].temperature : null
      const avgTemp24h =
        temps.length > 0 ? calcAverage(temps.map((t) => t.temperature)) : null
      const totalDoorOpenToday = doors.length
      const durations = doors
        .map((d) => d.duration_seconds)
        .filter((s): s is number => s !== null)
      const longestDoorOpenToday = durations.length > 0 ? Math.max(...durations) : null

      setStats({ currentTemp, avgTemp24h, totalDoorOpenToday, longestDoorOpenToday })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak dikenal'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(fetchData, 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchData])

  const formatTemp = (val: number | null) =>
    val !== null ? `${val.toFixed(1)}°C` : null

  const formatDurDisplay = (seconds: number | null) => {
    if (seconds === null) return null
    if (seconds < 60) return `${seconds} dtk`
    return `${Math.floor(seconds / 60)} mnt ${seconds % 60} dtk`
  }

  return (
    <main className="flex-1">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Error */}
        {error && (
          <ErrorMessage message={error} onRetry={fetchData} />
        )}

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LoadingSkeleton key={i} type="card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Suhu Saat Ini"
              value={formatTemp(stats.currentTemp)}
              subtitle="Pembacaan terakhir"
              icon="🌡️"
              color="blue"
            />
            <StatCard
              title="Rata-rata 24 Jam"
              value={formatTemp(stats.avgTemp24h)}
              subtitle="Suhu rata-rata hari ini"
              icon="📊"
              color={
                stats.avgTemp24h !== null && stats.avgTemp24h > -15
                  ? 'yellow'
                  : 'green'
              }
            />
            <StatCard
              title="Buka Pintu Hari Ini"
              value={stats.totalDoorOpenToday}
              subtitle="Total pembukaan pintu"
              icon="🚪"
              color="orange"
            />
            <StatCard
              title="Terlama Dibuka"
              value={formatDurDisplay(stats.longestDoorOpenToday)}
              subtitle="Durasi terpanjang hari ini"
              icon="⏱️"
              color={
                stats.longestDoorOpenToday !== null && stats.longestDoorOpenToday > 300
                  ? 'red'
                  : 'green'
              }
            />
          </div>
        )}

        {/* Temperature Chart */}
        <section className="rounded-xl bg-slate-800 border border-slate-700 p-5">
          <h2 className="text-slate-200 font-semibold text-base mb-4">
            Grafik Suhu — 24 Jam Terakhir
          </h2>
          <TemperatureChart
            data={tempData}
            showReferenceLine
            loading={loading}
            height={300}
          />
        </section>

        {/* Door Activity */}
        <section>
          <h2 className="text-slate-200 font-semibold text-base mb-3">
            Aktivitas Pintu Terbaru
          </h2>
          {loading ? (
            <LoadingSkeleton rows={10} cols={5} />
          ) : (
            <DoorTable data={doorData.slice(0, 10)} showPagination={false} />
          )}
        </section>
      </div>
    </main>
  )
}
