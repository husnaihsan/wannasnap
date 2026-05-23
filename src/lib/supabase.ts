import { createClient } from '@supabase/supabase-js'

// ── Browser client (used in React components) ──────────────
// Uses the anon key — safe to expose, RLS enforces access
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ── Server/admin client (used in API routes only) ──────────
// Uses the service role key — NEVER expose to the browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ── Types ──────────────────────────────────────────────────
export type Event = {
  id: string
  title: string
  slug: string
  date: string
  cover_image: string | null
  created_at: string
}

export type Photo = {
  id: string
  event_id: string
  image_url: string
  caption: string | null
  display_name: string | null
  created_at: string
}
