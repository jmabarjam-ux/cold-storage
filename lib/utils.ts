import { format } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format duration in seconds to a human-readable Indonesian string.
 * - null → "Belum ditutup"
 * - < 60  → "X detik"
 * - >= 60 → "X menit Y detik"
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return 'Belum ditutup'
  if (seconds < 60) return `${seconds} detik`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes} menit ${remainingSeconds} detik`
}

/**
 * Format ISO datetime string to "DD MMM YYYY HH:mm:ss" in id-ID locale.
 * Example: "10 Sep 2026 14:35:00"
 */
export function formatDatetime(iso: string): string {
  try {
    const date = new Date(iso)
    return format(date, 'dd MMM yyyy HH:mm:ss', { locale: id })
  } catch {
    return iso
  }
}

/**
 * Format ISO datetime string to "DD MMM" for chart axis labels.
 * Example: "10 Sep"
 */
export function formatDateShort(iso: string): string {
  try {
    const date = new Date(iso)
    return format(date, 'dd MMM', { locale: id })
  } catch {
    return iso
  }
}

/**
 * Format ISO datetime string to "HH:mm" for time-only display.
 */
export function formatTime(iso: string): string {
  try {
    const date = new Date(iso)
    return format(date, 'HH:mm')
  } catch {
    return iso
  }
}

/**
 * Calculate average of an array of numbers, rounded to 2 decimals.
 * Returns 0 if array is empty.
 */
export function calcAverage(nums: number[]): number {
  if (!nums || nums.length === 0) return 0
  const sum = nums.reduce((acc, n) => acc + n, 0)
  return Math.round((sum / nums.length) * 100) / 100
}

/**
 * Get the start of today as a Date object (00:00:00.000).
 */
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get a Date object N days ago from now.
 */
export function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

/**
 * Format a Date to YYYYMMDD string for filenames.
 */
export function formatDateForFilename(date: Date): string {
  return format(date, 'yyyyMMdd')
}
