import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'

export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('profiles')
      .select('*', {
        count: 'exact',
        head: true,
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase Admin radi.',
      profilesCount: count ?? 0,
      secretDetected: Boolean(process.env.SUPABASE_SECRET_KEY),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Nepoznata greška'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}