/**
 * Ambient type declarations for The Project Hope.
 *
 * This file is never shipped to the browser — it exists only so the
 * TypeScript checker understands the globals the site sets on `window`.
 * Run the checker with `npm run check:types`.
 */

interface HopeConfig {
  /** Supabase project URL, e.g. https://xxxx.supabase.co */
  SUPABASE_URL: string;
  /** Supabase "anon public" key. Public by design; never the service_role key. */
  SUPABASE_ANON_KEY: string;
  /** Shown to visitors when a submission fails, so they always have a way through. */
  FALLBACK_PHONE?: string;
  FALLBACK_WHATSAPP?: string;
}

interface Window {
  HOPE_CONFIG: HopeConfig;
}
