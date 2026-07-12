'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/src/lib/supabaseAdmin'
import { createSupabaseServerClient } from '@/src/lib/supabaseServer'

export async function deleteFault(formData: FormData) {
  const faultId = formData.get('faultId')

  if (typeof faultId !== 'string' || !faultId) {
    throw new Error('Nedostaje ID kvara.')
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } =
    await supabaseAdmin
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single()

  const isAdmin =
    profile?.is_admin === true ||
    profile?.role === 'admin'

  if (profileError || !isAdmin) {
    redirect('/')
  }

  const { error: deleteError } = await supabaseAdmin
    .from('fault_cases')
    .delete()
    .eq('id', faultId)

  if (deleteError) {
    console.error(deleteError)
    throw new Error('Kvar nije moguće obrisati.')
  }

  revalidatePath('/admin')
}

export async function deleteService(formData: FormData) {
  const serviceId = formData.get('serviceId')

  if (typeof serviceId !== 'string' || !serviceId) {
    throw new Error('Nedostaje ID servisa.')
  }

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } =
    await supabaseAdmin
      .from('profiles')
      .select('role, is_admin')
      .eq('id', user.id)
      .single()

  const isAdmin =
    profile?.is_admin === true ||
    profile?.role === 'admin'

  if (profileError || !isAdmin) {
    redirect('/')
  }

  const { error: deleteError } = await supabaseAdmin
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (deleteError) {
    console.error(deleteError)
    throw new Error('Servis nije moguće obrisati.')
  }

  revalidatePath('/admin')
  revalidatePath('/services')
  revalidatePath('/map')
}