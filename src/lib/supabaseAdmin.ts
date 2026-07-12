import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl) {
  throw new Error('Nedostaje NEXT_PUBLIC_SUPABASE_URL u .env.local')
}

if (!supabaseSecretKey) {
  throw new Error('Nedostaje SUPABASE_SECRET_KEY u .env.local')
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
)