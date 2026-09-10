export interface TemperatureLog {
  id: number
  temperature: number
  unit: string
  recorded_at: string
}

export interface DoorLog {
  id: number
  opened_at: string
  closed_at: string | null
  duration_seconds: number | null
  temperature_at_open: number | null
}

export interface DashboardStats {
  currentTemp: number | null
  avgTemp24h: number | null
  totalDoorOpenToday: number
  longestDoorOpenToday: number | null
}

export interface DateRange {
  from: Date
  to: Date
}
