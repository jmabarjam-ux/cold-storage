import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Cold Storage Monitor',
  description: 'Sistem monitoring suhu dan pintu cold storage secara real-time',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 min-h-screen`}
      >
        {/* Fixed sidebar */}
        <Sidebar />

        {/* Main content offset by sidebar width on md+ */}
        <div className="md:ml-[220px] min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
