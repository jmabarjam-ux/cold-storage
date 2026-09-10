interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-5 py-4 flex items-start gap-4">
      <span className="text-2xl mt-0.5">⚠️</span>
      <div className="flex-1">
        <p className="text-red-400 font-semibold text-sm mb-1">Terjadi Kesalahan</p>
        <p className="text-red-300/80 text-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}
