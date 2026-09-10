'use client'

import { useState } from 'react'
import { DoorLog } from '@/types'
import { formatDatetime, formatDuration } from '@/lib/utils'

interface DoorTableProps {
  data: DoorLog[]
  showPagination?: boolean
}

const ROWS_PER_PAGE = 20

export default function DoorTable({ data, showPagination = false }: DoorTableProps) {
  const [page, setPage] = useState(1)

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800 border border-slate-700 px-6 py-8 text-center text-slate-500 text-sm">
        Tidak ada data pintu.
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
              <th className="px-4 py-3 text-left font-medium">Dibuka</th>
              <th className="px-4 py-3 text-left font-medium">Ditutup</th>
              <th className="px-4 py-3 text-left font-medium">Durasi</th>
              <th className="px-4 py-3 text-left font-medium">Suhu saat Dibuka</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((log, index) => {
              const isLong = log.duration_seconds !== null && log.duration_seconds > 300
              const rowNum = showPagination ? (page - 1) * ROWS_PER_PAGE + index + 1 : index + 1
              return (
                <tr
                  key={log.id}
                  className={`border-t border-slate-700 transition-colors hover:bg-slate-700/50 ${
                    isLong ? 'bg-yellow-500/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-slate-400 tabular-nums">{rowNum}</td>
                  <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                    {formatDatetime(log.opened_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                    {log.closed_at ? formatDatetime(log.closed_at) : (
                      <span className="text-yellow-400 font-medium">Belum ditutup</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={isLong ? 'text-yellow-400 font-medium' : 'text-slate-200'}>
                      {formatDuration(log.duration_seconds)}
                    </span>
                    {isLong && (
                      <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                        ⚠️ Lama
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-200 tabular-nums">
                    {log.temperature_at_open !== null
                      ? `${log.temperature_at_open}°C`
                      : <span className="text-slate-500">—</span>
                    }
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
