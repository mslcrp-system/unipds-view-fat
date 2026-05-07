import { createClient } from '@supabase/supabase-js'

const url = process.env.UNIPDS_BANCO_URL!
const key = process.env.UNIPDS_BANCO_ANON_KEY!

export const supa = createClient(url, key, { auth: { persistSession: false } })
