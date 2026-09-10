'use client'

import { DateRange } from '@/types'
import { format } from 'date-fns'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

function toInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = new Date(e.target.value + 'T00:00:00')
    if (isNaN(newFrom.getTime())) return
    // Clamp: from cannot exceed to
    const clamped = newFrom > value.to ? value.to : newFrom
    onChange({ from: clamped, to: value.to })
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = new Date(e.target.value + 'T23:59:59')
    if (isNaN(newTo.getTime())) return
    // Clamp: to cannot be before from
    const clamped = newTo < value.from ? value.from : newTo
    onChange({ from: value.from, to: clamped })
  }

  const setPreset = (days: number) => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - days)
    if (days === 0) {
      from.setHours(0, 0, 0, 0)
    }
    onChange({ from, to })
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* From */}
      <div className="flex flex-col gap-1">
        <label className="text-slate-400 text-xs">Dari</label>
        <input
          type="date"
          value={toInputValue(value.from)}
          max={toInputValue(value.to)}
          onChange={handleFromChange}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
        />
      </div>

      {/* To */}
      <div className="flex flex-col gap-1">
        <label className="text-slate-400 text-xs">Sampai</label>
        <input
          type="date"
          value={toInputValue(value.to)}
          min={toInputValue(value.from)}
          onChange={handleToChange}
          className="bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
        />
      </div>

      {/* Presets */}
      <div className="flex gap-2 pb-0.5">
        <button
          onClick={() => setPreset(0)}
          className="px-3 py-2 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
        >
          Hari Ini
        </button>
        <button
          onClick={() => setPreset(7)}
          className="px-3 py-2 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
        >
          7 Hari
        </button>
        <button
          onClick={() => setPreset(30)}
          className="px-3 py-2 text-xs rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
        >
          30 Hari
        </button>
      </div>
    </div>
  )
}
