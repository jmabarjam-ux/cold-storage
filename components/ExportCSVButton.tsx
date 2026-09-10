'use client'

import Papa from 'papaparse'

interface ExportCSVButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  filename: string
  headers: string[]
}

export default function ExportCSVButton({ data, filename, headers }: ExportCSVButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diekspor.')
      return
    }

    const csv = Papa.unparse({
      fields: headers,
      data: data,
    })

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!data || data.length === 0}
    >
      <span>📥</span>
      <span>Export CSV</span>
    </button>
  )
}
