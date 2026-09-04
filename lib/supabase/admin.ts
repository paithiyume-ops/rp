import "server-only"
import { createClient } from "@supabase/supabase-js"

// Server-only client using the service role key.
// All DB access is server-authoritative: tables have RLS enabled with no public
// policies, so the anon key can never read/write rows directly. Authorization is
// enforced in server actions via the httpOnly session cookie.
let cached: ReturnType<typeof createClient> | null = null

export function getAdmin() {
  if (cached) return cached
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Supabase server credentials are not configured.")
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
