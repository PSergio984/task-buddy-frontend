import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let realtimeClient: SupabaseClient | null = null

export function getRealtimeClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return null

  if (!realtimeClient) {
    realtimeClient = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  return realtimeClient
}
