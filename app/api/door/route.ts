import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase.server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Default: start of today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const defaultFrom = todayStart.toISOString()
    const defaultTo = new Date().toISOString()

    const from = searchParams.get('from') ?? defaultFrom
    const to = searchParams.get('to') ?? defaultTo
    const limit = parseInt(searchParams.get('limit') ?? '200', 10)

    const { data, error, count } = await supabaseServer
      .from('door_logs')
      .select('*', { count: 'exact' })
      .gte('opened_at', from)
      .lte('opened_at', to)
      .order('opened_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[API /door] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    console.error('[API /door] Unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
