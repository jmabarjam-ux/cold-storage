'use client'

import { useState } from 'react'
import { TemperatureLog } from '@/types'
import { formatDatetime } from '@/lib/utils'

interface TemperatureTableProps {
  data: TemperatureLog[]
  showPagination?: boolean
}

const ROWS_PER_PAGE = 20

export default function TemperatureTable({ data, showPagination = false }: TemperatureTableProps) {
  const [page, setPage] = useState(1)

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800 border border-slate-700 px-6 py-8 text-center text-slate-500 text-sm">
        Tidak ada data suhu.
      </div>
    )
  }

  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE)
  const displayed = showPagination
    ? data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)
    : data

  return (
    <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-slate-300">
              <th className="px-4 py-3 text-left font-medium">No</th>
              <th className="px-4 py-3 text-left font-medium">Waktu</th>
              <th className="px-4 py-3 text-left font-medium">Suhu (°C)</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((log, index) => {
              const isEven = index % 2 === 0
              const rowNum = showPagination ? (page - 1) * ROWS_PER_PAGE + index + 1 : index + 1
              return (
                <tr
                  key={log.id}
                  className={`border-t border-slate-700 transition-colors hover:bg-slate-700/50 ${
                    isEven ? 'bg-slate-800' : 'bg-slate-800/60'
                  }`}
                >
                  <td className="px-4 py-3 text-slate-400 tabular-nums">{rowNum}</td>
                  <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                    {formatDatetime(log.recorded_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sky-400 font-semibold tabular-nums">
                      {log.temperature}°C
                    </span>
                    {log.unit && log.unit !== '°C' && (
                      <span className="ml-1 text-slate-500 text-xs">{log.unit}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
          <span className="text-slate-400 text-xs">
            Menampilkan {(page - 1) * ROWS_PER_PAGE + 1}–{Math.min(page * ROWS_PER_PAGE, data.length)} dari {data.length} data
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Sebelumnya
            </button>
            <span className="px-3 py-1.5 text-xs text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
