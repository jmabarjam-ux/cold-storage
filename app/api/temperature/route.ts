import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase.server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const defaultFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const defaultTo = new Date().toISOString()

    const from = searchParams.get('from') ?? defaultFrom
    const to = searchParams.get('to') ?? defaultTo
    const limit = parseInt(searchParams.get('limit') ?? '500', 10)

    const { data, error, count } = await supabaseServer
      .from('temperature_logs')
      .select('*', { count: 'exact' })
      .gte('recorded_at', from)
      .lte('recorded_at', to)
      .order('recorded_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('[API /temperature] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [], count: count ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    console.error('[API /temperature] Unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
