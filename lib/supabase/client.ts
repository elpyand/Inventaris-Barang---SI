import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // DEBUG: temporary logging to help identify why NEXT_PUBLIC envs
  // may be undefined in the browser bundle. Remove this after debugging.
  try {
    // eslint-disable-next-line no-console
    console.debug("[DEBUG] NEXT_PUBLIC_SUPABASE_URL:", url)
    // eslint-disable-next-line no-console
    console.debug("[DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY:", key ? "(present)" : key)
  } catch (e) {
    // ignore logging errors in some environments
  }

  if (!url || !key) {
    throw new Error(
      "Supabase client error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in your environment (see .env.local)"
    )
  }

  return createBrowserClient(url, key)
}
