"use client"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Browser client used ONLY for Realtime broadcast + presence channels.
// It carries the public anon key and never touches table data directly
// (tables are locked down by RLS with no public policies).
let cached: SupabaseClient | null = null

export function getRealtimeClient() {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) as string
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
