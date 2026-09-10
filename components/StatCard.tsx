interface StatCardProps {
  title: string
  value: string | number | null
  subtitle?: string
  icon?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'orange'
}

const colorMap: Record<NonNullable<StatCardProps['color']>, string> = {
  blue: 'border-sky-500/40 bg-sky-500/10',
  green: 'border-green-500/40 bg-green-500/10',
  yellow: 'border-yellow-500/40 bg-yellow-500/10',
  red: 'border-red-500/40 bg-red-500/10',
  orange: 'border-orange-500/40 bg-orange-500/10',
}

const valueColorMap: Record<NonNullable<StatCardProps['color']>, string> = {
  blue: 'text-sky-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  orange: 'text-orange-400',
}

export default function StatCard({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) {
  const borderBg = colorMap[color]
  const valueColor = valueColorMap[color]

  return (
    <div className={`rounded-xl p-4 border bg-slate-800 border-slate-700 ${borderBg} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-3xl font-bold tabular-nums ${valueColor}`}>
        {value === null || value === undefined ? (
          <span className="text-slate-500 text-xl">—</span>
        ) : (
          value
        )}
      </div>
      {subtitle && (
        <p className="text-slate-400 text-xs">{subtitle}</p>
      )}
    </div>
  )
}
